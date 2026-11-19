import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1) Cole aqui a URL e a chave anon/public do seu projeto Supabase.
const SUPABASE_URL = "COLE_SUA_SUPABASE_URL";
const SUPABASE_ANON_KEY = "COLE_SUA_CHAVE_ANON";
const WHATSAPP_NUMBER = "55DDDNUMERO"; // Ex.: 5547999999999 (somente números)

const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_ANON_KEY.startsWith("COLE_");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = id => document.getElementById(id);
let user = null, isSignup = false, products = [], activeProduct = null;
let cart = JSON.parse(localStorage.getItem("vorax-cart") || "[]");
let chatChannel = null;

function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
function modal(id,show=true){$(id).classList.toggle("open",show)}
function money(n){return Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function imageFallback(url){return url||"https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&q=80"}

async function loadProducts(){
  if(!supabase){products=[{id:"demo1",name:"Oversized Identity",price:129.9,category:"Camisetas",description:"Camiseta oversized de presença marcante.",image_url:"https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&q=80"},{id:"demo2",name:"VØRAX Essential",price:99.9,category:"Essentials",description:"Minimalismo com atitude.",image_url:"https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=900&q=80"},{id:"demo3",name:"Urban Signal",price:149.9,category:"Drop 001",description:"Uma peça para deixar sua marca.",image_url:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80"}];renderProducts();return}
  const {data,error}=await supabase.from("products").select("*").eq("active",true).order("created_at",{ascending:false});
  if(error){toast("Não foi possível carregar os produtos.");console.error(error);return}
  products=data||[];renderProducts();
}
function renderProducts(){
  $("products").innerHTML=products.length?products.map(p=>`<article class="product" data-product="${escapeHtml(p.id)}"><div class="product-img"><img src="${escapeHtml(imageFallback(p.image_url))}" alt="${escapeHtml(p.name)}" loading="lazy"></div><div class="product-info"><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.category||"VØRAX COLLECTION")}</p></div><span class="price">${money(p.price)}</span></div></article>`).join(""):'<p class="muted">A primeira coleção está chegando. Volte em breve.</p>';
  document.querySelectorAll("[data-product]").forEach(el=>el.addEventListener("click",()=>showProduct(el.dataset.product)));
}
function showProduct(id){
  activeProduct=products.find(p=>String(p.id)===String(id));if(!activeProduct)return;
  $("productDetails").innerHTML=`<img class="detail-image" src="${escapeHtml(imageFallback(activeProduct.image_url))}" alt="${escapeHtml(activeProduct.name)}"><p class="eyebrow red">${escapeHtml(activeProduct.category||"VØRAX")}</p><h2>${escapeHtml(activeProduct.name)}</h2><div class="detail-price">${money(activeProduct.price)}</div><p class="detail-copy">${escapeHtml(activeProduct.description||"Streetwear. Identity. Attitude.")}</p><button id="addProduct" class="cta full">ADICIONAR À SACOLA ↗</button><div id="reviewsArea"></div>`;
  $("addProduct").onclick=()=>{addToCart(activeProduct);modal("productModal",false)};
  modal("productModal");loadReviews(id);
}
async function loadReviews(id){
  if(!supabase)return;
  const {data}=await supabase.from("reviews").select("rating,comment,created_at").eq("product_id",id).order("created_at",{ascending:false}).limit(8);
  $("reviewsArea").innerHTML='<h3>AVALIAÇÕES</h3>'+(data||[]).map(r=>`<p class="detail-copy">★ ${r.rating}/5 — ${escapeHtml(r.comment||"")}</p>`).join("")+`<form id="reviewForm"><select id="reviewRating"><option value="5">5 estrelas</option><option value="4">4 estrelas</option><option value="3">3 estrelas</option><option value="2">2 estrelas</option><option value="1">1 estrela</option></select><input id="reviewComment" placeholder="Conte sua experiência" maxlength="500" required><button class="outline">ENVIAR AVALIAÇÃO</button></form>`;
  $("reviewForm").onsubmit=async e=>{e.preventDefault();if(!user)return toast("Entre na sua conta para avaliar.");const {error}=await supabase.from("reviews").insert({product_id:id,user_id:user.id,rating:Number($("reviewRating").value),comment:$("reviewComment").value});toast(error?"Não foi possível enviar.":"Avaliação enviada!");if(!error)loadReviews(id)};
}
function addToCart(p){const found=cart.find(x=>x.id===p.id);if(found)found.qty++;else cart.push({id:p.id,name:p.name,price:p.price,qty:1});saveCart();toast("Produto adicionado à sacola.")}
function saveCart(){localStorage.setItem("vorax-cart",JSON.stringify(cart));$("cartCount").textContent=cart.reduce((n,p)=>n+p.qty,0)}
function renderCart(){
  $("cartItems").innerHTML=cart.length?cart.map(p=>`<div class="cart-row"><span>${escapeHtml(p.name)} × ${p.qty}</span><span>${money(p.price*p.qty)} <button data-remove="${escapeHtml(p.id)}">×</button></span></div>`).join(""):'<p class="muted">Sua sacola está vazia.</p>';
  $("cartTotal").textContent=money(cart.reduce((n,p)=>n+p.price*p.qty,0));
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart=cart.filter(p=>String(p.id)!==b.dataset.remove);saveCart();renderCart()});
}
async function refreshUser(){
  if(!supabase)return;
  const {data}=await supabase.auth.getSession();user=data.session?.user||null;
  $("accountBtn").textContent=user?"MINHA CONTA":"ENTRAR";
  $("accountBtn").onclick=()=>user?openAccount():modal("authModal");
}
async function openAccount(){
  if(!user)return modal("authModal");
  const {data}=await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(data?.role==="admin"){modal("adminModal");loadAdminProducts()}
  else toast("Você está conectado como "+user.email);
}
$("authForm").onsubmit=async e=>{
  e.preventDefault();if(!supabase)return toast("Configure o Supabase primeiro.");
  const email=$("authEmail").value,password=$("authPassword").value;
  const result=isSignup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
  $("authMessage").textContent=result.error?.message||(isSignup?"Cadastro criado. Verifique seu e-mail para confirmar.":"Login realizado!");
  if(!result.error&&!isSignup){await refreshUser();setTimeout(()=>modal("authModal",false),700)}
};
$("authToggle").onclick=()=>{isSignup=!isSignup;$("authTitle").textContent=isSignup?"CRIAR CONTA":"ENTRAR";$("authToggle").textContent=isSignup?"Já tem conta? Entrar":"Ainda não tem conta? Cadastre-se"};
$("cartBtn").onclick=()=>{renderCart();modal("cartModal")};
$("accountBtn").onclick=()=>modal("authModal");
$("checkoutBtn").onclick=async()=>{
  if(!cart.length)return toast("Sua sacola está vazia.");
  const total=cart.reduce((n,p)=>n+p.price*p.qty,0);
  const lines=cart.map(p=>`${p.qty}x ${p.name} — ${money(p.price*p.qty)}`).join("\n");
  const msg=`Olá, VØRAX! Quero fazer este pedido:\n${lines}\nTotal: ${money(total)}\nMeu nome:`;
  if(supabase&&user){const {error}=await supabase.from("orders").insert({user_id:user.id,items:cart,total,status:"pending"});if(error)console.error(error)}
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank");
};
$("whatsLink").href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Gostaria de conhecer a VØRAX.")}`;
$("chatBtn").onclick=()=>{modal("chatModal");startChat()};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest(".modal").classList.remove("open"));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));
$("productForm").onsubmit=async e=>{
  e.preventDefault();if(!user)return toast("Faça login.");
  const product={name:$("pName").value,price:Number($("pPrice").value),image_url:$("pImage").value,category:$("pCategory").value,description:$("pDescription").value,active:true};
  const {error}=await supabase.from("products").insert(product);
  if(error)toast("Erro: "+error.message);else{toast("Produto publicado!");e.target.reset();loadProducts();loadAdminProducts()}
};
async function loadAdminProducts(){
  if(!supabase)return;
  const {data}=await supabase.from("products").select("id,name,price").order("created_at",{ascending:false});
  $("adminProducts").innerHTML=(data||[]).map(p=>`<div class="cart-row"><span>${escapeHtml(p.name)} — ${money(p.price)}</span><button data-delete="${p.id}">EXCLUIR</button></div>`).join("");
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(confirm("Excluir este produto?")){const {error}=await supabase.from("products").delete().eq("id",b.dataset.delete);if(error)toast(error.message);else{loadProducts();loadAdminProducts()}}});
}
async function startChat(){
  if(!supabase)return;
  if(!user){$("chatMessages").innerHTML='<p class="muted">Entre na sua conta para conversar.</p>';return}
  const {data}=await supabase.from("chat_messages").select("id,user_id,message,created_at").order("created_at").limit(60);
  $("chatMessages").innerHTML=(data||[]).map(messageHtml).join("");$("chatMessages").scrollTop=$("chatMessages").scrollHeight;
  if(chatChannel)supabase.removeChannel(chatChannel);
  chatChannel=supabase.channel("public-chat").on("postgres_changes",{event:"INSERT",schema:"public",table:"chat_messages"},payload=>{$("chatMessages").insertAdjacentHTML("beforeend",messageHtml(payload.new));$("chatMessages").scrollTop=$("chatMessages").scrollHeight}).subscribe();
}
function messageHtml(m){return `<div class="chat-message"><b>${m.user_id===user?.id?"Você":"Membro VØRAX"}</b><br>${escapeHtml(m.message)}</div>`}
$("chatForm").onsubmit=async e=>{e.preventDefault();if(!user)return toast("Entre na sua conta para conversar.");const message=$("chatInput").value.trim();if(!message)return;const {error}=await supabase.from("chat_messages").insert({user_id:user.id,message});if(error)toast(error.message);else $("chatInput").value=""};
if(!configured){toast("Modo demonstração: configure o Supabase para ativar login, banco, chat e avaliações.");}
loadProducts();if(supabase){refreshUser();supabase.auth.onAuthStateChange(()=>refreshUser())}saveCart();
