// n8n webhook that creates the Mercado Pago preference server-side
const CHECKOUT_ENDPOINT = 'https://n8n-production-7c86.up.railway.app/webhook/checkout';

let cart = JSON.parse(localStorage.getItem('memi-cart') || '[]');

function saveCart() {
  localStorage.setItem('memi-cart', JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

function updateCartUI() {
  const count = cart.length;
  document.getElementById('cart-count').textContent = count;

  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total-value');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (count === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Seu carrinho está vazio 🛒</p>';
    checkoutBtn.disabled = true;
    totalEl.textContent = 'R$ 0,00';
    return;
  }

  checkoutBtn.disabled = false;
  totalEl.textContent = 'R$ ' + getCartTotal().toFixed(2).replace('.', ',');

  itemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <span class="cart-item-emoji">${item.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-size">${item.size}</div>
        <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${idx})" title="Remover">✕</button>
    </div>
  `).join('');
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartUI();
  pushEvent('remove_from_cart', { item_id: cart[idx]?.id });
}

function addToCart(product, size) {
  cart.push({ ...product, size });
  saveCart();
  updateCartUI();
  pushEvent('add_to_cart', { item_id: product.id, item_name: product.name, price: product.price, size });
  showToast(`${product.emoji} ${product.name} adicionado!`);

  const btn = document.querySelector(`[data-id="${product.id}"] .add-btn`);
  if (btn) {
    btn.textContent = '✓ Adicionado';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = '+ Adicionar';
      btn.classList.remove('added');
    }, 1500);
  }
}

function openCart() {
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-sidebar').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-sidebar').classList.remove('open');
  document.body.style.overflow = '';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function pushEvent(name, params = {}) {
  if (typeof dataLayer !== 'undefined') {
    dataLayer.push({ event: name, ...params });
  }
}

async function startCheckout() {
  if (cart.length === 0) return;

  pushEvent('begin_checkout', {
    value: getCartTotal(),
    items: cart.map(i => ({ item_id: i.id, item_name: i.name, price: i.price }))
  });

  const btn = document.getElementById('checkout-btn');
  btn.textContent = 'Aguarde...';
  btn.disabled = true;

  try {
    const items = cart.map(item => ({
      id: item.id,
      title: `${item.name} (${item.size})`,
      quantity: 1,
      currency_id: 'BRL',
      unit_price: item.price
    }));

    const res = await fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        external_reference: `memi-${Date.now()}`
      })
    });

    const data = await res.json();

    if (data.init_point) {
      cart = [];
      saveCart();
      window.location.href = data.init_point;
    } else {
      throw new Error('Sem init_point');
    }
  } catch (err) {
    console.error('Checkout error:', err);
    showToast('Erro ao abrir checkout. Tente novamente.');
    btn.textContent = 'Finalizar pedido';
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cart-btn').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('checkout-btn').addEventListener('click', startCheckout);
  updateCartUI();
});
