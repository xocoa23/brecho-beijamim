// Variáveis globais
let cart = [];
let cartTotal = 0;
let soldProductIds = new Set();
let isAdminMode = false;
let isAuthenticated = false;
// ATENÇÃO: Em produção, mover autenticação para o backend
// PIN de acesso admin - configurar antes de usar
const ADMIN_PIN = 'ALTERAR_ANTES_DE_USAR';
// Contexto do produto atualmente selecionado no menu admin
let currentAdminContext = null;

// ATENÇÃO: Em produção, mover autenticação para o backend com hash de senhas
// Credenciais de demonstração - ALTERAR antes de usar em produção
const ADMIN_CREDENTIALS = {
    username: 'ALTERAR_USUARIO',
    password: 'ALTERAR_SENHA'
};
// Email da loja (substituir quando tiver o oficial)
const STORE_EMAIL = 'SEU_EMAIL_AQUI'; // Substituir pelo email real da loja
// Botão Correios
const ADMIN_PANEL_POSITION_KEY = 'brechoAdminPanelPosition';
let adminPanelDragInitialized = false;
const ADMIN_PANEL_MINIMIZED_KEY = 'brechoAdminPanelMinimized';

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Evitar flash: esconder catálogo até aplicar estados/overrides
    document.body.classList.remove('catalog-ready');
    initializeEventListeners();
    loadCartFromStorage();
    loadProductsFromStorage();
    loadSoldFromStorage();
    applyRemovedProducts();
    applyProductOverrides();
    updateCartDisplay();
    applySoldStateToCatalog();
    applySavedPriceChanges();
    restoreAuthenticationFromStorage();
    initializeAdminMode();
    initializeAuthentication();
    // Imagens agora são referenciadas diretamente no HTML (sem fallback dinâmico)
    forceRoundedCorners();
    // Mostrar catálogo após ajustes
    requestAnimationFrame(() => document.body.classList.add('catalog-ready'));
});

// Gerar código de rastreamento único (simulado)
function generateTrackingCode() {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `BR${ts}${rnd}`;
}

// Validação de imagem de produto
function isValidProductImagePath(input) {
    if (!input) return false;
    const value = String(input).trim();
    if (value.startsWith('icon:')) return true;
    if (/^https?:\/\//i.test(value)) return true;
    // Permitir caminhos iniciando com assets/
    const path = value.startsWith('assets/') ? value : value;
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    return allowed.some(ext => path.toLowerCase().endsWith(ext));
}

// Função para forçar bordas arredondadas na primeira imagem
function forceRoundedCorners() {
    const heroImg = document.getElementById('hero-topo-img');
    const heroContainer = document.querySelector('.hero-image .image-placeholder');
    
    if (heroImg) {
        heroImg.style.borderRadius = '16px';
        heroImg.style.width = '100%';
        heroImg.style.height = '100%';
        heroImg.style.objectFit = 'cover';
        heroImg.style.objectPosition = 'center';
        heroImg.style.display = 'block';
    }
    
    if (heroContainer) {
        heroContainer.style.borderRadius = '16px';
        heroContainer.style.overflow = 'hidden';
        heroContainer.style.width = '100%';
        heroContainer.style.height = '500px';
        heroContainer.style.display = 'flex';
        heroContainer.style.alignItems = 'center';
        heroContainer.style.justifyContent = 'center';
    }
}

// Inicializar event listeners
function initializeEventListeners() {
    // Navigation
    setupSmoothScrolling();
    setupMobileMenu();
    
    // Product filters
    setupProductFilters();
    
    // Cart functionality
    setupCartFunctionality();
    
    // Contact form
    setupContactForm();
}

// Navegação suave
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Hero buttons
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    heroButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Menu mobile
function setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// Filtros de produtos
function setupProductFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.produto-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            productCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.style.opacity = '1';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Funcionalidade do carrinho
function setupCartFunctionality() {
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            const productPrice = parseFloat(this.getAttribute('data-price'));
            if (isProductSold(productId)) {
                alert('Este produto já foi vendido e não está mais disponível.');
                return;
            }
            
            addToCart({
                id: productId,
                name: productName,
                price: productPrice
            });
        });
    });
    
    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle');
    const cartModal = document.getElementById('cart-modal');
    // Seleciona especificamente o X do carrinho, evitando conflito com outros .close-modal
    const closeModal = document.querySelector('#cart-modal .close-modal');
    const paymentModal = document.getElementById('payment-modal');
    const closePaymentModal = document.querySelector('.close-payment-modal');
    
    if (cartToggle && cartModal) {
        cartToggle.addEventListener('click', function(e) {
            e.preventDefault();
            cartModal.style.display = 'block';
        });
    }
    
    if (closeModal && cartModal) {
        closeModal.addEventListener('click', function() {
            cartModal.style.display = 'none';
        });
    }

    if (closePaymentModal && paymentModal) {
        closePaymentModal.addEventListener('click', function() {
            paymentModal.style.display = 'none';
        });
    }

    // Botão Correios: abre site dos Correios com último código salvo
    const correiosBtn = document.getElementById('correios-track');
    if (correiosBtn) {
        correiosBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = 'https://www2.correios.com.br/sistemas/rastreamento/';
            window.open(url, '_blank');
        });
    }

    
    // Close modal when clicking outside
    if (cartModal) {
        cartModal.addEventListener('click', function(e) {
            if (e.target === cartModal) {
                cartModal.style.display = 'none';
            }
        });
    }

    if (paymentModal) {
        paymentModal.addEventListener('click', function(e) {
            if (e.target === paymentModal) {
                paymentModal.style.display = 'none';
            }
        });
    }
    
    // Clear cart
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            clearCart();
        });
    }
    
    // Checkout
    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length > 0) {
                openPaymentModal();
            } else {
                alert('Seu carrinho está vazio!');
            }
        });
    }
}

function openPaymentModal() {
    const paymentModal = document.getElementById('payment-modal');
    const paymentSubtotal = document.getElementById('payment-subtotal');
    const paymentShipping = document.getElementById('payment-shipping');
    const paymentTotal = document.getElementById('payment-total');
    const orderItemsList = document.getElementById('order-items');
    if (!paymentModal || !paymentSubtotal || !paymentTotal || !paymentShipping || !orderItemsList) return;

    paymentSubtotal.textContent = 'R$ ' + cartTotal.toFixed(2);
    const selectedShipping = getSelectedShipping();
    const shippingValue = selectedShipping ? selectedShipping.price : 0;
    paymentShipping.textContent = 'R$ ' + shippingValue.toFixed(2);
    paymentTotal.textContent = 'R$ ' + (cartTotal + shippingValue).toFixed(2);
    orderItemsList.innerHTML = cart.map(item => `<li>${item.quantity}x ${item.name} — R$ ${(item.price * item.quantity).toFixed(2)}</li>`).join('');

    paymentModal.style.display = 'block';
}

// Pix copy and WhatsApp order
document.addEventListener('DOMContentLoaded', function() {
    const backToCartBtn = document.getElementById('back-to-cart');
    const paymentModal = document.getElementById('payment-modal');
    const cartModal = document.getElementById('cart-modal');

    const calcShippingBtn = document.getElementById('calc-shipping');
    const shippingOptionsEl = document.getElementById('shipping-options');
    const shippingStatusEl = document.getElementById('shipping-status');
    const generatePixBtn = document.getElementById('generate-pix');
    const pixDisplay = document.getElementById('pix-display');
    const pixQr = document.getElementById('pix-qr');
    const pixStatus = document.getElementById('pix-status');
    const pixBrcode = document.getElementById('pix-brcode');

    if (backToCartBtn && paymentModal && cartModal) {
        backToCartBtn.addEventListener('click', function() {
            paymentModal.style.display = 'none';
            cartModal.style.display = 'block';
        });
    }



    if (calcShippingBtn && shippingOptionsEl && shippingStatusEl) {
        calcShippingBtn.addEventListener('click', function() {
            const cep = document.getElementById('ship-cep')?.value?.replace(/\D/g, '');
            if (!cep || cep.length < 8) {
                shippingStatusEl.textContent = 'Informe um CEP válido (8 dígitos).';
                return;
            }
            shippingStatusEl.textContent = 'Calculando...';
            // Simulação de cálculo: PAC e SEDEX com base em valor do carrinho
            setTimeout(() => {
                const pac = { service: 'PAC', price: Math.max(15, cartTotal * 0.08), deadline: 8 };
                const sedex = { service: 'SEDEX', price: Math.max(25, cartTotal * 0.12), deadline: 4 };
                renderShippingOptions([pac, sedex]);
                shippingStatusEl.textContent = 'Escolha uma opção de frete:';
                if (generatePixBtn) generatePixBtn.disabled = false;
            }, 600);
        });
    }

    // Geração de QR Code Pix (simulado) e reconhecimento automático
    if (generatePixBtn && pixDisplay && pixQr && pixStatus) {
        generatePixBtn.addEventListener('click', function() {
            const total = (cartTotal + (getSelectedShipping()?.price || 0)).toFixed(2);
            // BRCode dinâmico simulado
            const brcode = `00020126580014BR.GOV.BCB.PIX0136SUA_CHAVE_PIX_AQUI5204000053039865406${total.replace('.', '')}5802BR5920Brecho Beijamim6009SAO PAULO62130510CHAVEFAKE6304ABCD`;
            if (pixBrcode) {
                pixBrcode.style.display = 'block';
                pixBrcode.value = brcode;
            }
            // Exibir QR Placeholder (poderíamos integrar um gerador real)
            pixDisplay.style.display = 'block';
            pixQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(brcode)}`;
            pixStatus.textContent = 'Aguardando pagamento Pix...';

            // Simulação de reconhecimento automático: após 12s, confirmar
            // Em produção, substituir por webhook/polling do provedor Pix
            setTimeout(() => {
                autoConfirmPayment();
            }, 12000);
        });
    }
});

function renderShippingOptions(options) {
    const shippingOptionsEl = document.getElementById('shipping-options');
    const paymentShipping = document.getElementById('payment-shipping');
    const paymentTotal = document.getElementById('payment-total');
    const generatePixBtn = document.getElementById('generate-pix');
    if (!shippingOptionsEl || !paymentShipping || !paymentTotal) return;
    shippingOptionsEl.innerHTML = options.map((opt, idx) => `
        <label class="option">
            <span>${opt.service} — R$ ${opt.price.toFixed(2)} · ${opt.deadline} dias</span>
            <input type="radio" name="shippingOption" value="${idx}">
        </label>
    `).join('');

    const radios = shippingOptionsEl.querySelectorAll('input[name="shippingOption"]');
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            const idx = parseInt(this.value, 10);
            const selected = options[idx];
            saveSelectedShipping(selected);
            paymentShipping.textContent = 'R$ ' + selected.price.toFixed(2);
            paymentTotal.textContent = 'R$ ' + (cartTotal + selected.price).toFixed(2);
            if (generatePixBtn) generatePixBtn.disabled = false;
        });
    });
}

function saveSelectedShipping(option) {
    sessionStorage.setItem('selectedShipping', JSON.stringify(option));
}

function getSelectedShipping() {
    const raw = sessionStorage.getItem('selectedShipping');
    return raw ? JSON.parse(raw) : null;
}

function buildAddress() {
    const name = document.getElementById('ship-name')?.value?.trim() || '';
    const email = document.getElementById('ship-email')?.value?.trim() || '';
    const phone = document.getElementById('ship-phone')?.value?.trim() || '';
    const cep = document.getElementById('ship-cep')?.value?.trim() || '';
    const uf = document.getElementById('ship-uf')?.value?.trim() || '';
    const city = document.getElementById('ship-city')?.value?.trim() || '';
    const neighborhood = document.getElementById('ship-neighborhood')?.value?.trim() || '';
    const street = document.getElementById('ship-street')?.value?.trim() || '';
    const number = document.getElementById('ship-number')?.value?.trim() || '';
    const complement = document.getElementById('ship-complement')?.value?.trim() || '';
    const lines = [
        `${name} <${email}> (${phone})`,
        `${street}, ${number} ${complement ? '(' + complement + ')' : ''}`,
        `${neighborhood} - ${city}/${uf}`,
        `CEP: ${cep}`
    ];
    return lines.join('%0A');
}

function buildOrderMailto() {
    const address = buildAddress();
    const ship = getSelectedShipping();
    const items = cart.map(item => `${item.quantity}x ${item.name} — R$ ${(item.price * item.quantity).toFixed(2)}`).join('%0A');
    const shippingText = ship ? `${ship.service} — R$ ${ship.price.toFixed(2)} (prazo: ${ship.deadline} dias)` : 'A calcular';
    const total = (cartTotal + (ship ? ship.price : 0)).toFixed(2);
    const subject = encodeURIComponent('Novo Pedido - Site Brechó');
    const body = `Pedido:%0A%0A${items}%0A%0AFrete: ${shippingText}%0AEndereço:%0A${address}%0A%0ATotal: R$ ${total}`;
    const toCustomer = (document.getElementById('ship-email')?.value || '').trim();
    const toOwner = STORE_EMAIL; // Usa o email configurado no topo do arquivo
    // Sugere envio tanto para o cliente quanto para o dono (cópia)
    return `mailto:${toOwner}?cc=${encodeURIComponent(toCustomer)}&subject=${subject}&body=${body}`;
}

// Adicionar produto ao carrinho
function addToCart(product) {
    const existingProduct = cart.find(item => item.id === product.id);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    saveCartToStorage();
    showAddToCartNotification(product.name);
}

// Remover produto do carrinho
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    saveCartToStorage();
}

// Limpar carrinho
function clearCart() {
    cart = [];
    updateCartDisplay();
    saveCartToStorage();
}

// Atualizar display do carrinho
function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.querySelector('.total-price');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
    
    // Update cart total
    cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalPrice) {
        totalPrice.textContent = 'R$ ' + cartTotal.toFixed(2);
    }
    
    // Update cart items
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <div class="item-price">R$ ${item.price.toFixed(2)} x ${item.quantity}</div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    }
}

// Salvar carrinho no localStorage
function saveCartToStorage() {
    localStorage.setItem('brechoCart', JSON.stringify(cart));
}

// Carregar carrinho do localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('brechoCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Notificação de produto adicionado
function showAddToCartNotification(productName) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${productName} adicionado ao carrinho!</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #333;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Formulário de contato
function setupContactForm() {
    const contactForm = document.querySelector('.contato-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = this.querySelector('#contato-nome')?.value?.trim() || '';
            const email = this.querySelector('#contato-email')?.value?.trim() || '';
            const phone = this.querySelector('#contato-telefone')?.value?.trim() || '';
            const subject = this.querySelector('#contato-assunto')?.value?.trim() || '';
            const message = this.querySelector('#contato-mensagem')?.value?.trim() || '';

            const mailSubject = `Contato pelo site - ${subject || 'Sem assunto'}`;
            const mailBody = `Nome: ${name}\nEmail: ${email}\nTelefone: ${phone}\n\nMensagem:\n${message}`;
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(STORE_EMAIL)}&cc=${encodeURIComponent(email)}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
            window.open(gmailUrl, '_blank');

            showNotification('Abrindo o Gmail para enviar sua mensagem...', 'info');

            this.reset();
        });
    }
}

// Newsletter form
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            alert(`Obrigado!\n\nEmail ${email} foi inscrito na nossa newsletter.`);
            this.reset();
        });
    }
});

// Scroll effects: mantém rosa e auto-hide
(function() {
    const header = document.querySelector('.header');
    if (!header) return;
    const primary = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color')
        .trim();

    let lastScrollY = window.scrollY;
    header.style.background = primary;
    header.style.backdropFilter = 'none';

    window.addEventListener('scroll', function() {
        const currentY = window.scrollY;
        header.style.background = primary; // garante rosa sempre

        const isScrollingDown = currentY > lastScrollY;
        const threshold = 10; // evita flicker em pequenos movimentos

        if (Math.abs(currentY - lastScrollY) > threshold) {
            if (isScrollingDown && currentY > 80) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
            lastScrollY = currentY;
        }
    });
})();

// Quick view functionality
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-quick-view')) {
        const productCard = e.target.closest('.produto-card');
        const productName = productCard.querySelector('h3').textContent;
        const productPrice = productCard.querySelector('.produto-price').textContent;
        
        alert(`${productName}\n${productPrice}\n\nFuncionalidade de visualização rápida em desenvolvimento!`);
    }
});

// Keyboard accessibility
document.addEventListener('keydown', function(e) {
    // Close modal with ESC key
    if (e.key === 'Escape') {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal && cartModal.style.display === 'block') {
            cartModal.style.display = 'none';
        }
    }
});

// Loading animation for images (when real images are added)
function setupImageLoading() {
    const imagePlaceholders = document.querySelectorAll('.image-placeholder');
    
    imagePlaceholders.forEach(placeholder => {
        placeholder.addEventListener('click', function() {
            this.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Carregando imagem...</p>
                </div>
            `;
            
            setTimeout(() => {
                this.innerHTML = `
                    <i class="fas fa-image"></i>
                    <p>Imagem carregada!</p>
                `;
            }, 2000);
        });
    });
} 

// Persistência de vendidos
function loadSoldFromStorage() {
    const raw = localStorage.getItem('brechoSold');
    if (raw) {
        try {
            const arr = JSON.parse(raw);
            soldProductIds = new Set(arr);
        } catch (e) {
            soldProductIds = new Set();
        }
    }
}

// ===== Rastreamento em Tempo Real (simulado no front) =====
function startRealTimeTracking(trackingCode) {
    const trackingResult = document.getElementById('tracking-result');
    const list = document.getElementById('tracking-status-list');
    if (!trackingResult || !list) return;
    trackingResult.style.display = 'block';
    list.innerHTML = '';

    // Cancela ciclo anterior
    if (trackingTimer) { clearInterval(trackingTimer); trackingTimer = null; }

    // Estado simulado do progresso
    const steps = [
        { key: 'CONFIRMED', title: 'Pagamento confirmado', icon: '✓' },
        { key: 'PREPARING', title: 'Pedido em preparação', icon: '📦' },
        { key: 'SHIPPED', title: 'Pedido enviado', icon: '🚚' },
        { key: 'OUT_FOR_DELIVERY', title: 'Saiu para entrega', icon: '🛵' },
        { key: 'DELIVERED', title: 'Entregue', icon: '🏠' }
    ];
    let currentIndex = 0;

    function renderStep(step, date) {
        const row = document.createElement('div');
        row.className = 'tracking-row';
        row.style.cssText = 'display:flex; gap:8px; align-items:center; padding:8px 0; border-bottom:1px solid #eee;';
        row.innerHTML = `
            <div class="ico" style="width:28px; text-align:center; font-size:18px;">${step.icon}</div>
            <div class="content" style="flex:1">
                <div style="font-weight:600; color:#333;">${step.title}</div>
                <div style="color:#666; font-size:0.9rem;">${date}</div>
            </div>
        `;
        list.insertBefore(row, list.firstChild);
    }

    function tick() {
        const step = steps[currentIndex];
        const date = new Date().toLocaleString('pt-BR');
        renderStep(step, date);
        if (currentIndex < steps.length - 1) {
            currentIndex += 1;
        } else {
            clearInterval(trackingTimer);
            trackingTimer = null;
        }
    }

    // Primeira atualização imediata
    tick();
    // Atualizações periódicas
    trackingTimer = setInterval(tick, TRACKING_POLL_MS);
}

function saveSoldToStorage() {
    localStorage.setItem('brechoSold', JSON.stringify(Array.from(soldProductIds)));
}

function isProductSold(productId) {
    return soldProductIds.has(String(productId));
}

function applySoldStateToCatalog() {
    document.querySelectorAll('.produto-card').forEach(card => {
        const btn = card.querySelector('.btn-add-cart');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (isProductSold(id)) {
            card.classList.add('sold');
            btn.disabled = true;
            btn.textContent = 'Indisponível';
        } else {
            card.classList.remove('sold');
            btn.disabled = false;
            btn.textContent = 'Adicionar ao Carrinho';
        }
    });
}

// Pagamento Pix (simulação) → confirmação automática
function autoConfirmPayment() {
    if (cart.length === 0) return;

    // Coletar dados (se necessário para email)
    const customerData = {
        name: document.getElementById('ship-name').value,
        email: document.getElementById('ship-email').value,
        phone: document.getElementById('ship-phone').value,
        cep: document.getElementById('ship-cep').value,
        uf: document.getElementById('ship-uf').value,
        city: document.getElementById('ship-city').value,
        neighborhood: document.getElementById('ship-neighborhood').value,
        street: document.getElementById('ship-street').value,
        number: document.getElementById('ship-number').value,
        complement: document.getElementById('ship-complement').value
    };

    const orderDetails = {
        items: cart,
        subtotal: cartTotal,
        shipping: getSelectedShipping() ? getSelectedShipping().price : 0,
        total: cartTotal + (getSelectedShipping() ? getSelectedShipping().price : 0)
    };

    // Gerar código de rastreio e enviar emails automaticamente
    const trackingCode = generateTrackingCode();
    try { localStorage.setItem('brechoLastTrackingCode', trackingCode); } catch {}
    sendOrderEmails(customerData, orderDetails, trackingCode);
    
    // Marcar itens do carrinho como vendidos
    cart.forEach(item => soldProductIds.add(String(item.id)));
    saveSoldToStorage();
    applySoldStateToCatalog();
    clearCart();

    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) paymentModal.style.display = 'none';
    alert(`Pagamento confirmado automaticamente.\n\nCódigo de rastreio: ${trackingCode}\nItens marcados como vendidos.`);
}

// Função para enviar emails automaticamente após confirmação de pagamento
function sendOrderEmails(customerData, orderDetails, trackingCode) {
    // Email para o comprador (Gmail Compose)
    const customerEmailSubject = `Seu pedido foi confirmado! - Código de rastreio: ${trackingCode}`;
    const customerEmailBody = `Olá ${customerData.name},\n\n` +
`Seu pagamento foi confirmado e seu pedido está sendo preparado.\n` +
`\nCÓDIGO DE RASTREIO: ${trackingCode}\n` +
`\nDETALHES DO PEDIDO:\n` +
orderDetails.items.map(item => `• ${item.quantity}x ${item.name} - R$ ${item.price.toFixed(2)}`).join('\n') +
`\n\nSubtotal: R$ ${orderDetails.subtotal.toFixed(2)}\n` +
`Frete: R$ ${orderDetails.shipping.toFixed(2)}\n` +
`Total: R$ ${orderDetails.total.toFixed(2)}\n` +
`\nENDEREÇO DE ENTREGA:\n` +
`${customerData.street}, ${customerData.number}${customerData.complement ? ' (' + customerData.complement + ')' : ''}\n` +
`${customerData.neighborhood} - ${customerData.city}/${customerData.uf}\n` +
`CEP: ${customerData.cep}\n` +
`\nQualquer dúvida, responda este email.\n` +
`\nObrigada,\nEquipe Brechó Beijamim`;

    const gmailCustomerUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(customerData.email)}&su=${encodeURIComponent(customerEmailSubject)}&body=${encodeURIComponent(customerEmailBody)}`;
    window.open(gmailCustomerUrl, '_blank');

    // Email para a loja (Gmail Compose)
    const storeEmailSubject = `Novo pedido confirmado - ${customerData.name} - ${trackingCode}`;
    const storeEmailBody = `NOVO PEDIDO CONFIRMADO\n\n` +
`CÓDIGO DE RASTREIO: ${trackingCode}\n` +
`\nDADOS DO CLIENTE:\n` +
`Nome: ${customerData.name}\n` +
`Email: ${customerData.email}\n` +
`Telefone: ${customerData.phone}\n` +
`Endereço: ${customerData.street}, ${customerData.number}${customerData.complement ? ' (' + customerData.complement + ')' : ''} - ${customerData.neighborhood} - ${customerData.city}/${customerData.uf} - CEP ${customerData.cep}\n` +
`\nITENS:\n` +
orderDetails.items.map(item => `• ${item.quantity}x ${item.name} - R$ ${item.price.toFixed(2)}`).join('\n') +
`\n\nSubtotal: R$ ${orderDetails.subtotal.toFixed(2)}\n` +
`Frete: R$ ${orderDetails.shipping.toFixed(2)}\n` +
`Total: R$ ${orderDetails.total.toFixed(2)}\n` +
`\nPagamento: Pix (simulado) — Status: Confirmado`;

    const gmailStoreUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(STORE_EMAIL)}&su=${encodeURIComponent(storeEmailSubject)}&body=${encodeURIComponent(storeEmailBody)}`;
    window.open(gmailStoreUrl, '_blank');
}

// Context menu do vendedor (restaurado)
document.addEventListener('contextmenu', function(e) {
    if (!isAdminMode) return;
    const card = e.target.closest('.produto-card');
    if (!card) return;
    e.preventDefault();
    openAdminMenuAt(e.clientX, e.clientY, card);
});

document.addEventListener('click', function(e) {
    const menu = document.getElementById('admin-context');
    if (!menu) return;
    if (!menu.classList.contains('hidden') && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// Delegação global para cliques dentro do menu admin (#admin-context)
document.addEventListener('click', function(e) {
    const menu = document.getElementById('admin-context');
    if (!menu || menu.classList.contains('hidden')) return;
    const actionBtn = e.target.closest('#admin-context [data-action]');
    if (!actionBtn) return;
    const action = actionBtn.getAttribute('data-action');
    if (!currentAdminContext) return;
    const { productId, productName, productPrice, priceEl, card } = currentAdminContext;

    

    if (action === 'mark-sold') {
        showConfirm(menu, `Marcar "${productName}" como vendido?`, () => {
            markProductAsSold(productId, productName, true);
            menu.classList.add('hidden');
        });
        return;
    }

    if (action === 'make-available') {
        showConfirm(menu, 'Confirmar: deixar disponível?', () => {
            makeProductAvailable(productId, productName, true);
            menu.classList.add('hidden');
        });
        return;
    }

    if (action === 'remove-product') {
        showConfirm(menu, `Remover definitivamente "${productName}" do catálogo?`, () => {
            removeProduct(productId, card);
            menu.classList.add('hidden');
        });
        return;
    }

    if (action === 'edit-product') {
        openEditProductModal(productId, card);
        menu.classList.add('hidden');
        return;
    }
});

function openAdminMenuAt(x, y, card) {
    const menu = document.getElementById('admin-context');
    if (!menu) return;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
    const priceEl = card.querySelector('.produto-price');
    const addBtn = card.querySelector('.btn-add-cart');
    const productId = addBtn?.getAttribute('data-id');
    const productName = addBtn?.getAttribute('data-name');
    const productPrice = parseFloat(addBtn?.getAttribute('data-price') || '0');
    const alreadySold = productId ? isProductSold(productId) : false;

    // Guardar contexto atual para handlers delegados
    currentAdminContext = { productId, productName, productPrice, priceEl, card };

    if (alreadySold) {
        menu.innerHTML = `
            <button type="button" data-action="make-available">Deixar produto disponível</button>
            <button type="button" data-action="edit-product">Editar produto</button>
            <button type="button" data-action="remove-product">Remover produto</button>
        `;
        // Handler específico substituído pela delegação global
        return;
    }

    menu.innerHTML = `
        <button type="button" data-action="edit-product">Editar produto</button>
        <button type="button" data-action="mark-sold">Marcar como vendido</button>
        <button type="button" data-action="remove-product">Remover produto</button>
    `;

    // Handlers específicos substituídos pela delegação global
}

function showConfirm(menu, message, onYes) {
    menu.classList.remove('hidden');
    const confirmHTML = `
        <div class="confirm-message">${message}</div>
        <div class="confirm-actions">
            <button type="button" data-ans="no">Não</button>
            <button type="button" data-ans="yes">Sim</button>
        </div>
    `;
    menu.innerHTML = confirmHTML;
    const yes = menu.querySelector('[data-ans="yes"]');
    const no = menu.querySelector('[data-ans="no"]');
    if (no) { no.onclick = () => { menu.classList.add('hidden'); }; }
    if (yes) { yes.onclick = () => { onYes?.(); }; }
}

function initializeAdminMode() {
    // Mantém o estado atual; modo admin é controlado por autenticação/restauração
    // (não sobrescrever aqui)
} 

// Carregar e renderizar produtos dinamicamente
async function loadAndRenderProducts() {
    // Simplificado: não usamos mais products.json nesta versão estática
}

function renderProducts(products) {
    const grid = document.querySelector('.produtos-grid');
    if (!grid) return;
    grid.innerHTML = products.map(p => productCardHTML(p)).join('');
    // Aplicar preços salvos após renderização dinâmica
    applySavedPriceChanges();
}

function productCardHTML(p) {
    const isSold = isProductSold(p.id) || p.status === 'sold';
    const BASE_IMG = 'assets/produtos/';
    const resolvedImage = p.image?.startsWith('icon:') || p.image?.startsWith('http') || p.image?.startsWith('assets/')
        ? p.image
        : `${BASE_IMG}${p.image}`;
    const iconHtml = p.image?.startsWith('icon:')
        ? `<i class="fas ${p.image.replace('icon:', '')}"></i>`
        : `<img src="${resolvedImage}" alt="${p.name}"/>`;
    return `
    <div class="produto-card ${isSold ? 'sold' : ''}" data-category="${p.category}">
        <div class="produto-image">
            <div class="image-placeholder">${iconHtml}</div>
            <div class="produto-overlay">
                <button class="btn-quick-view">Ver Detalhes</button>
            </div>
        </div>
        <div class="produto-info">
            <h3>${p.name}</h3>
            <p class="produto-price">R$ ${Number(p.price).toFixed(2)}</p>
            <button class="btn-add-cart" data-id="${p.id}" data-name="${p.name}" data-price="${Number(p.price).toFixed(2)}" ${isSold ? 'disabled' : ''}>
                ${isSold ? 'Indisponível' : 'Adicionar ao Carrinho'}
            </button>
        </div>
    </div>`;
}

function setupDynamicFilters(products) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.onclick = () => {
            const filter = btn.getAttribute('data-filter');
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
            renderProducts(filtered);
            applySoldStateToCatalog();
            setupCartFunctionality();
            applySavedPriceChanges();
        };
    });
}

// ===== SISTEMA DE AUTENTICAÇÃO =====

// Inicializar sistema de autenticação
function initializeAuthentication() {
    // Sistema de 5 cliques na flor do footer para acesso administrativo
    setupFooterFlowerAdminAccess();

    // Modal de login
    const loginModal = document.getElementById('login-modal');
    const closeLoginModal = document.getElementById('close-login-modal');
    const loginForm = document.getElementById('login-form');

    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', closeLoginModalHandler);
    }

    if (loginModal) {
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                closeLoginModalHandler();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Painel administrativo
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        // botão agora minimiza (logout permanece via 5 cliques no rodapé)
        logoutBtn.id = 'minimize-admin';
        logoutBtn.textContent = 'Minimizar';
        logoutBtn.addEventListener('click', minimizeAdminPanel);
    }

    // Botões do painel administrativo
    setupAdminPanelButtons();
    setupMinimizeButton();
}

// Restaurar autenticação do localStorage ao carregar
function restoreAuthenticationFromStorage() {
    const auth = localStorage.getItem('brechoAuthenticated') === 'true';
    const admin = localStorage.getItem('brechoAdmin') === 'true';
    if (auth && admin) {
        isAuthenticated = true;
        isAdminMode = true;
        openAdminPanel();
        enableProductEditing();
        updateAdminStats();
    }
}

// Configurar sistema de 5 cliques na flor do footer
function setupFooterFlowerAdminAccess() {
    const footerFlower = document.querySelector('.footer-logo-icon');
    let clickCount = 0;
    let clickTimeout;

    if (footerFlower) {
        footerFlower.addEventListener('click', function(e) {
            e.preventDefault();
            clickCount++;
            
            // Reset do contador após 3 segundos sem cliques
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                clickCount = 0;
            }, 3000);

            // Mostrar feedback visual
            this.style.transform = 'translateY(1px) scale(1.1)';
            setTimeout(() => {
                this.style.transform = 'translateY(1px) scale(1)';
            }, 150);

            // Verificar se atingiu 5 cliques
            if (clickCount >= 5) {
                clickCount = 0;
                // Toggle admin: se já autenticado, desloga; senão abre login
                if (isAuthenticated && isAdminMode) {
                    handleLogout();
                } else {
                    openLoginModal();
                }
                
                // Feedback visual especial
                this.style.transform = 'translateY(1px) scale(1.2)';
                this.style.filter = 'brightness(1.2)';
                setTimeout(() => {
                    this.style.transform = 'translateY(1px) scale(1)';
                    this.style.filter = 'brightness(1)';
                }, 300);
            }
        });

        // Adicionar cursor pointer para indicar interatividade
        footerFlower.style.cursor = 'pointer';
        footerFlower.title = 'Clique 5 vezes para acessar área administrativa';
    }
}

// Abrir modal de login
function openLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focar no campo de usuário
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            setTimeout(() => usernameInput.focus(), 100);
        }
    }
}

// Fechar modal de login
function closeLoginModalHandler() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Limpar formulário
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Esconder mensagem de erro
        const errorMessage = document.getElementById('login-error');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
}

// Processar login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('login-error');
    
    // Verificar credenciais
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAuthenticated = true;
        isAdminMode = true; // Ativar modo administrativo
        closeLoginModalHandler();
        openAdminPanel();
        updateAdminStats();
        
        // Ativar funcionalidades de edição
        enableProductEditing();
        
        // Salvar estado de autenticação
        localStorage.setItem('brechoAuthenticated', 'true');
        localStorage.setItem('brechoAdmin', 'true');
    } else {
        // Mostrar erro
        if (errorMessage) {
            errorMessage.style.display = 'block';
        }
        
        // Limpar senha
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// Abrir painel administrativo
function openAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        const minimized = localStorage.getItem(ADMIN_PANEL_MINIMIZED_KEY) === 'true';
        if (minimized) {
            ensureAdminFab();
        } else {
            adminPanel.classList.remove('hidden');
        }
        // Não bloquear o scroll da página
        ensureAdminPanelDraggable(adminPanel);
        restoreAdminPanelPosition(adminPanel);
    }
}

// Fechar painel administrativo
function closeAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.add('hidden');
    }
}

// ===== Painel administrativo arrastável =====
function ensureAdminPanelDraggable(panel) {
    if (adminPanelDragInitialized) return;
    adminPanelDragInitialized = true;

    const handle = panel.querySelector('.admin-panel-header') || panel; // usa header se existir
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const onPointerDown = (e) => {
        const evt = e.touches ? e.touches[0] : e;
        // Apenas botão esquerdo no mouse
        if (evt.button !== undefined && evt.button !== 0) return;
        isDragging = true;
        // Garante posição fixa para mover pela viewport
        const style = window.getComputedStyle(panel);
        if (style.position !== 'fixed') {
            panel.style.position = 'fixed';
        }
        // Define z-index alto para ficar acima
        panel.style.zIndex = '10000';

        const rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        startX = evt.clientX;
        startY = evt.clientY;

        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('touchend', onPointerUp);
        e.preventDefault?.();
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        const evt = e.touches ? e.touches[0] : e;
        const dx = evt.clientX - startX;
        const dy = evt.clientY - startY;
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;

        // Limites para não sair totalmente da tela
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = panel.getBoundingClientRect();
        const maxLeft = vw - rect.width;
        const maxTop = vh - rect.height;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';

        // Evitar scroll durante arrasto em touch
        if (e.cancelable) e.preventDefault();
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('touchend', onPointerUp);
        persistAdminPanelPosition(panel);
    };

    handle.style.cursor = 'move';
    handle.addEventListener('mousedown', onPointerDown);
    handle.addEventListener('touchstart', onPointerDown, { passive: false });
}

function persistAdminPanelPosition(panel) {
    const rect = panel.getBoundingClientRect();
    const pos = { left: rect.left, top: rect.top };
    try { localStorage.setItem(ADMIN_PANEL_POSITION_KEY, JSON.stringify(pos)); } catch {}
}

function restoreAdminPanelPosition(panel) {
    try {
        const raw = localStorage.getItem(ADMIN_PANEL_POSITION_KEY);
        if (!raw) return;
        const pos = JSON.parse(raw);
        panel.style.position = 'fixed';
        if (Number.isFinite(pos.left)) panel.style.left = pos.left + 'px';
        if (Number.isFinite(pos.top)) panel.style.top = pos.top + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.zIndex = '10000';
    } catch {}
}

// ===== Minimizar painel para FAB =====
function setupMinimizeButton() {
    const btn = document.getElementById('minimize-admin');
    if (!btn) return;
    btn.addEventListener('click', minimizeAdminPanel);
}

function minimizeAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (!panel) return;
    panel.classList.add('hidden');
    localStorage.setItem(ADMIN_PANEL_MINIMIZED_KEY, 'true');
    ensureAdminFab();
}

function ensureAdminFab() {
    if (document.getElementById('admin-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'admin-fab';
    fab.className = 'admin-panel-fab';
    fab.innerHTML = '<i class="fas fa-tools"></i>';
    fab.title = 'Abrir painel administrativo';
    fab.addEventListener('click', () => {
        const panel = document.getElementById('admin-panel');
        if (panel) {
            panel.classList.remove('hidden');
            localStorage.setItem(ADMIN_PANEL_MINIMIZED_KEY, 'false');
            fab.remove();
        }
    });
    document.body.appendChild(fab);
}

// Processar logout
function handleLogout() {
    isAuthenticated = false;
    isAdminMode = false; // Desativar modo administrativo
    closeAdminPanel();
    // Remover ícone flutuante imediatamente
    const fab = document.getElementById('admin-fab');
    if (fab && fab.parentNode) {
        fab.parentNode.removeChild(fab);
    }
    // Limpar estado de minimizado para não recriar automaticamente
    try { localStorage.setItem(ADMIN_PANEL_MINIMIZED_KEY, 'false'); } catch {}
    // Fechar menus/admin-context se abertos
    const adminMenu = document.getElementById('admin-context');
    if (adminMenu) adminMenu.classList.add('hidden');
    currentAdminContext = null;
    
    // Desativar funcionalidades de edição
    disableProductEditing();
    
    // Limpar dados de autenticação
    localStorage.removeItem('brechoAuthenticated');
    localStorage.removeItem('brechoAdmin');
    
    // Mostrar confirmação
    if (confirm('Tem certeza que deseja sair da área administrativa?')) {
        // Logout confirmado
        console.log('Logout realizado com sucesso');
    }
}

// Configurar botões do painel administrativo
function setupAdminPanelButtons() {
    const viewOrdersBtn = document.getElementById('view-orders-btn');
    const adminSettingsBtn = document.getElementById('admin-settings-btn');
    const addProductBtn = document.getElementById('add-product-btn');

    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', function() {
            alert('Funcionalidade de visualização de pedidos será implementada em breve!');
        });
    }

    if (adminSettingsBtn) {
        adminSettingsBtn.addEventListener('click', function() {
            alert('Funcionalidade de configurações será implementada em breve!');
        });
    }

    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddProductModal);
    }
}

// Alternar visibilidade do editor de produtos
// Removido: editor sempre visível no painel

// Atualizar estatísticas do painel administrativo
function updateAdminStats() {
    const soldCount = document.getElementById('sold-count');
    const availableCount = document.getElementById('available-count');
    const totalCount = document.getElementById('total-count');
    
    if (soldCount) {
        soldCount.textContent = soldProductIds.size;
    }
    
    if (availableCount) {
        const totalProducts = document.querySelectorAll('.produto-card').length;
        availableCount.textContent = totalProducts - soldProductIds.size;
    }
    
    if (totalCount) {
        const totalProducts = document.querySelectorAll('.produto-card').length;
        totalCount.textContent = totalProducts;
    }
}

// ===== FUNCIONALIDADES DE EDIÇÃO DE PRODUTOS =====

// Ativar funcionalidades de edição
function enableProductEditing() {
    // Adicionar event listeners para clique direito nos produtos
    // Desativado para evitar conflito com o menu oficial #admin-context
    // document.addEventListener('contextmenu', handleProductRightClick);
    
    // Adicionar indicador visual nos produtos
    addEditingIndicators();
    
    console.log('Funcionalidades de edição ativadas');
}

// Desativar funcionalidades de edição
function disableProductEditing() {
    // Remover event listeners
    document.removeEventListener('contextmenu', handleProductRightClick);
    
    // Remover indicadores visuais
    removeEditingIndicators();
    
    console.log('Funcionalidades de edição desativadas');
}

// Adicionar indicadores visuais de edição
function addEditingIndicators() {
    const productCards = document.querySelectorAll('.produto-card');
    productCards.forEach(card => {
        card.classList.add('editable');
        card.title = 'Botão direito para editar';
    });
}

// Remover indicadores visuais de edição
function removeEditingIndicators() {
    const productCards = document.querySelectorAll('.produto-card');
    productCards.forEach(card => {
        card.classList.remove('editable');
        card.title = '';
    });
}

// Lidar com clique direito nos produtos
function handleProductRightClick(e) {
    if (!isAuthenticated || !isAdminMode) return;
    
    const productCard = e.target.closest('.produto-card');
    if (!productCard) return;
    
    e.preventDefault();
    
    // Obter informações do produto
    const productId = productCard.querySelector('.btn-add-cart')?.getAttribute('data-id');
    const productName = productCard.querySelector('.btn-add-cart')?.getAttribute('data-name');
    const productPrice = productCard.querySelector('.btn-add-cart')?.getAttribute('data-price');
    const isSold = productCard.classList.contains('sold');
    
    if (!productId || !productName || !productPrice) return;
    
    // Mostrar menu de edição
    showProductEditMenu(e, productId, productName, productPrice, isSold);
}

// Mostrar menu de edição do produto
function showProductEditMenu(e, productId, productName, productPrice, isSold) {
    // Remover menu anterior se existir
    const existingMenu = document.getElementById('product-edit-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Criar menu de edição
    const menu = document.createElement('div');
    menu.id = 'product-edit-menu';
    menu.className = 'product-edit-menu';
    
    // Posicionar menu
    menu.style.position = 'fixed';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.style.zIndex = '9999';
    
    // Conteúdo do menu baseado no status do produto
    if (isSold) {
        menu.innerHTML = `
            <div class="edit-menu-item" data-action="make-available">
                <i class="fas fa-undo"></i>
                <span>Deixar Disponível</span>
            </div>
            <div class="edit-menu-item" data-action="edit-product">
                <i class="fas fa-pen"></i>
                <span>Editar Produto</span>
            </div>
        `;
    } else {
        menu.innerHTML = `
            <div class="edit-menu-item" data-action="mark-sold">
                <i class="fas fa-check-circle"></i>
                <span>Marcar como Vendido</span>
            </div>
            <div class="edit-menu-item" data-action="edit-product">
                <i class="fas fa-pen"></i>
                <span>Editar Produto</span>
            </div>
        `;
    }
    
    // Adicionar ao DOM
    document.body.appendChild(menu);
    
    // Adicionar event listeners
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        const action = e.target.closest('.edit-menu-item')?.getAttribute('data-action');
        
        if (action === 'mark-sold') {
            markProductAsSold(productId, productName);
        } else if (action === 'make-available') {
            makeProductAvailable(productId, productName);
        } else if (action === 'edit-product') {
            const btn = document.querySelector(`.btn-add-cart[data-id="${productId}"]`);
            const card = btn?.closest('.produto-card');
            if (card) openEditProductModal(productId, card);
        }
        
        menu.remove();
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
    });
}

// Marcar produto como vendido
function markProductAsSold(productId, productName, skipConfirm = false) {
    if (!skipConfirm) {
        if (!confirm(`Marcar "${productName}" como vendido?`)) return;
    }
    soldProductIds.add(String(productId));
    saveSoldToStorage();
    applySoldStateToCatalog();
    updateAdminStats();
    showNotification(`"${productName}" marcado como vendido!`, 'success');
}

// Deixar produto disponível
function makeProductAvailable(productId, productName, skipConfirm = false) {
    if (!skipConfirm) {
        if (!confirm(`Deixar "${productName}" disponível para venda?`)) return;
    }
    soldProductIds.delete(String(productId));
    saveSoldToStorage();
    applySoldStateToCatalog();
    updateAdminStats();
    showNotification(`"${productName}" disponível para venda!`, 'success');
}

// Editar preço do produto
function editProductPrice(productId, productName, currentPrice) {
    // Usar prompt simples para testar
    const newPrice = prompt(`Novo preço para "${productName}" (R$):`, currentPrice);
    
    if (newPrice && newPrice !== currentPrice) {
        const price = parseFloat(newPrice.replace(',', '.'));
        
        if (isNaN(price) || price <= 0) {
            alert('Preço inválido! Digite um valor maior que zero.');
            return;
        }
        
        // Atualizar preço no DOM
        const productCard = document.querySelector(`[data-id="${productId}"]`)?.closest('.produto-card');
        if (productCard) {
            const priceElement = productCard.querySelector('.produto-price');
            const addButton = productCard.querySelector('.btn-add-cart');
            
            if (priceElement) {
                priceElement.textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
            }
            
            if (addButton) {
                addButton.setAttribute('data-price', price.toFixed(2));
            }
        }
        
        // Salvar alteração
        saveProductPriceChange(productId, price);
        
        // Mostrar notificação de sucesso
        alert(`Preço de "${productName}" alterado para R$ ${price.toFixed(2).replace('.', ',')}!`);
    }
}

// Abrir modal de edição de preço
function openPriceEditModal(productId, productName, currentPrice) {
    const modal = document.getElementById('price-edit-modal');
    const productNameElement = document.getElementById('price-edit-product-name');
    const currentPriceElement = document.getElementById('current-price-value');
    const newPriceInput = document.getElementById('new-price');
    
    if (modal && productNameElement && currentPriceElement && newPriceInput) {
        // Preencher informações do produto
        productNameElement.textContent = productName;
        currentPriceElement.textContent = `R$ ${currentPrice}`;
        newPriceInput.value = currentPrice.replace('R$ ', '').replace(',', '.');
        
        // Mostrar modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focar no campo de preço
        setTimeout(() => {
            newPriceInput.focus();
            newPriceInput.select();
        }, 100);
        
        // Configurar event listeners
        setupPriceEditModalListeners(productId, productName);
    }
}

// Configurar event listeners do modal de edição de preço
function setupPriceEditModalListeners(productId, productName) {
    const modal = document.getElementById('price-edit-modal');
    const closeBtn = document.getElementById('close-price-modal');
    const cancelBtn = document.getElementById('cancel-price-edit');
    const form = document.getElementById('price-edit-form');
    const newPriceInput = document.getElementById('new-price');
    
    // Função para fechar modal
    const closeModal = () => {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    // Remover event listeners anteriores para evitar duplicação
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = closeModal;
    }
    
    // Fechar ao clicar fora do modal
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
    }
    
    // Submissão do formulário
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const newPrice = parseFloat(newPriceInput.value);
            
            if (isNaN(newPrice) || newPrice <= 0) {
                showNotification('Preço inválido! Digite um valor maior que zero.', 'error');
                return;
            }
            
            // Atualizar preço no DOM
            updateProductPrice(productId, productName, newPrice);
            closeModal();
        };
    }
    
    // Formatação automática do input
    if (newPriceInput) {
        newPriceInput.addEventListener('input', (e) => {
            let value = e.target.value;
            // Permitir apenas números e ponto decimal
            value = value.replace(/[^0-9.]/g, '');
            // Garantir apenas um ponto decimal
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            e.target.value = value;
        });
        
        // Permitir Enter para salvar
        newPriceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        });
    }
}

// Atualizar preço do produto no DOM
function updateProductPrice(productId, productName, newPrice) {
    const productCard = document.querySelector(`[data-id="${productId}"]`)?.closest('.produto-card');
    if (productCard) {
        const priceElement = productCard.querySelector('.produto-price');
        const addButton = productCard.querySelector('.btn-add-cart');
        
        if (priceElement) {
            priceElement.textContent = `R$ ${newPrice.toFixed(2).replace('.', ',')}`;
        }
        
        if (addButton) {
            addButton.setAttribute('data-price', newPrice.toFixed(2));
        }
    }
    
    // Salvar alteração
    saveProductPriceChange(productId, newPrice);
    
    // Mostrar notificação de sucesso
    showNotification(`Preço de "${productName}" alterado para R$ ${newPrice.toFixed(2).replace('.', ',')}!`, 'success');
}

// Salvar alteração de preço (simulação)
function saveProductPriceChange(productId, newPrice) {
    // Em um sistema real, isso seria enviado para o backend
    const priceChanges = JSON.parse(localStorage.getItem('productPriceChanges') || '{}');
    priceChanges[productId] = newPrice;
    localStorage.setItem('productPriceChanges', JSON.stringify(priceChanges));
}

// Aplicar preços salvos do localStorage aos cards na página
function applySavedPriceChanges() {
    try {
        const priceChanges = JSON.parse(localStorage.getItem('productPriceChanges') || '{}');
        Object.keys(priceChanges).forEach(productId => {
            const newPrice = Number(priceChanges[productId]);
            if (!isFinite(newPrice) || newPrice <= 0) return;
            const addBtn = document.querySelector(`.btn-add-cart[data-id="${productId}"]`);
            const card = addBtn ? addBtn.closest('.produto-card') : null;
            if (!card) return;
            const priceEl = card.querySelector('.produto-price');
            if (priceEl) {
                priceEl.textContent = `R$ ${newPrice.toFixed(2).replace('.', ',')}`;
            }
            if (addBtn) {
                addBtn.setAttribute('data-price', newPrice.toFixed(2));
            }
        });
    } catch (_) {
        // ignore
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.getElementById('admin-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.id = 'admin-notification';
    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}


// Inicializar após DOM pronto
document.addEventListener('DOMContentLoaded', function() {
    loadAndRenderProducts();
});

// ===== Helpers de remoção/edição persistentes =====
function removeProduct(id, card) {
    if (card && card.parentNode) card.parentNode.removeChild(card);
    const raw = localStorage.getItem(REMOVED_PRODUCTS_KEY);
    const set = new Set(raw ? JSON.parse(raw) : []);
    set.add(String(id));
    localStorage.setItem(REMOVED_PRODUCTS_KEY, JSON.stringify(Array.from(set)));
    // Também tentar retirar de adicionados
    const rawList = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (rawList) {
        const list = JSON.parse(rawList).filter(p => String(p.id) !== String(id));
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
    }
    updateAdminStats();
}

function applyRemovedProducts() {
    const raw = localStorage.getItem(REMOVED_PRODUCTS_KEY);
    if (!raw) return;
    const ids = new Set(JSON.parse(raw));
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        const id = btn.getAttribute('data-id');
        if (ids.has(String(id))) {
            const card = btn.closest('.produto-card');
            if (card && card.parentNode) card.parentNode.removeChild(card);
        }
    });
}

function saveProductOverride(id, data) {
    const raw = localStorage.getItem(PRODUCT_OVERRIDES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[String(id)] = { ...(map[String(id)] || {}), ...data };
    localStorage.setItem(PRODUCT_OVERRIDES_KEY, JSON.stringify(map));
}

function applyProductOverrides() {
    const raw = localStorage.getItem(PRODUCT_OVERRIDES_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    Object.keys(map).forEach(id => {
        const card = document.querySelector(`.btn-add-cart[data-id="${id}"]`)?.closest('.produto-card');
        if (!card) return;
        const ov = map[id];
        if (ov.category) card.setAttribute('data-category', ov.category);
        if (ov.name) {
            card.querySelector('h3').textContent = ov.name;
            const btn = card.querySelector('.btn-add-cart');
            if (btn) btn.setAttribute('data-name', ov.name);
        }
        if (Number.isFinite(ov.price)) {
            card.querySelector('.produto-price').textContent = `R$ ${Number(ov.price).toFixed(2).replace('.', ',')}`;
            const btn = card.querySelector('.btn-add-cart');
            if (btn) btn.setAttribute('data-price', Number(ov.price).toFixed(2));
        }
        if (ov.image) {
            const placeholder = card.querySelector('.image-placeholder');
            if (ov.image.startsWith('icon:')) {
                placeholder.innerHTML = `<i class="fas ${ov.image.replace('icon:', '')}"></i>`;
            } else {
                placeholder.innerHTML = `<img src="${ov.image}" alt="${ov.name || ''}"/>`;
            }
        }
    });
}

function openEditProductModal(productId, card) {
    openAddProductModal();
    const modal = document.getElementById('add-product-modal');
    const title = modal?.querySelector('.modal-header h3');
    if (title) title.innerHTML = '<i class="fas fa-pen"></i> Editar Produto';
    const nameEl = document.getElementById('ap-name');
    const priceEl = document.getElementById('ap-price');
    const catEl = document.getElementById('ap-category');
    const imgEl = document.getElementById('ap-image');
    const current = {
        name: card.querySelector('h3')?.textContent || '',
        price: parseFloat(card.querySelector('.btn-add-cart')?.getAttribute('data-price') || '0') || 0,
        category: card.getAttribute('data-category') || 'feminino',
        image: (card.querySelector('.image-placeholder img')?.getAttribute('src')) ||
               (card.querySelector('.image-placeholder i') ? 'icon:' + card.querySelector('.image-placeholder i').classList[1] : '')
    };
    if (nameEl) nameEl.value = current.name;
    if (priceEl) priceEl.value = current.price;
    if (catEl) catEl.value = current.category;
    if (imgEl) imgEl.value = current.image;

    const form = document.getElementById('add-product-form');
    if (!form) return;
    form.onsubmit = (e) => {
        e.preventDefault();
        const name = nameEl.value.trim();
        const price = parseFloat(priceEl.value);
        const category = catEl.value;
        let image = imgEl.value.trim();
        if (!isValidProductImagePath(image)) {
            alert('Imagem inválida. Use arquivo .jpg, .jpeg, .png, .webp, .gif, .svg, URL http(s) ou icon:fa-*');
            return;
        }
        if (image && !image.startsWith('icon:') && !image.startsWith('http') && !image.startsWith('assets/')) {
            image = `assets/produtos/${image}`;
        }
        if (!name || !Number.isFinite(price) || price <= 0 || !category || !image) {
            alert('Preencha todos os campos com valores válidos.');
            return;
        }
        // Atualiza DOM
        card.setAttribute('data-category', category);
        card.querySelector('h3').textContent = name;
        card.querySelector('.produto-price').textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
        const btn = card.querySelector('.btn-add-cart');
        if (btn) {
            btn.setAttribute('data-name', name);
            btn.setAttribute('data-price', price.toFixed(2));
        }
        const placeholder = card.querySelector('.image-placeholder');
        if (image.startsWith('icon:')) {
            placeholder.innerHTML = `<i class=\"fas ${image.replace('icon:', '')}\"></i>`;
        } else {
            placeholder.innerHTML = `<img src=\"${image}\" alt=\"${name}\"/>`;
        }
        saveProductOverride(productId, { name, price, category, image });
        document.getElementById('add-product-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        showNotification('Produto atualizado!', 'success');
        updateAdminStats();
    };
}

// ===== PRODUTOS DINÂMICOS (LocalStorage) =====
const PRODUCTS_STORAGE_KEY = 'brechoProducts';
const REMOVED_PRODUCTS_KEY = 'brechoRemovedProducts';
const PRODUCT_OVERRIDES_KEY = 'brechoProductOverrides';

function loadProductsFromStorage() {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    const extras = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(extras) || extras.length === 0) return;
    // Render append dos novos produtos mantendo os estáticos
    const grid = document.querySelector('.produtos-grid');
    if (!grid) return;
    const html = extras.map(p => productCardHTML(p)).join('');
    grid.insertAdjacentHTML('beforeend', html);
    setupCartFunctionality();
    applySoldStateToCatalog();
    applySavedPriceChanges();
    updateAdminStats();
}

function saveProductToStorage(product) {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(product);
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
}

function generateProductId() {
    // Gera ID incremental baseado no maior ID existente na página e no storage
    const idsOnPage = Array.from(document.querySelectorAll('.btn-add-cart'))
        .map(btn => parseInt(btn.getAttribute('data-id'), 10))
        .filter(n => Number.isFinite(n));
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const idsStorage = list.map(p => parseInt(p.id, 10)).filter(n => Number.isFinite(n));
    const maxId = Math.max(0, ...idsOnPage, ...idsStorage);
    return String(maxId + 1);
}

function openAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    const closeBtn = document.getElementById('close-add-product');
    const cancelBtn = document.getElementById('cancel-add-product');
    const form = document.getElementById('add-product-form');
    if (!modal || !form) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const close = () => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; };
    if (closeBtn) closeBtn.onclick = close;
    if (cancelBtn) cancelBtn.onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    form.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('ap-name').value.trim();
        const price = parseFloat(document.getElementById('ap-price').value);
        const category = document.getElementById('ap-category').value;
        let image = document.getElementById('ap-image').value.trim();
        if (!isValidProductImagePath(image)) {
            alert('Imagem inválida. Use arquivo .jpg, .jpeg, .png, .webp, .gif, .svg, URL http(s) ou icon:fa-*');
            return;
        }
        if (image && !image.startsWith('icon:') && !image.startsWith('http') && !image.startsWith('assets/')) {
            image = `assets/produtos/${image}`;
        }
        if (!name || !Number.isFinite(price) || price <= 0 || !category || !image) {
            alert('Preencha todos os campos com valores válidos.');
            return;
        }
        const id = generateProductId();
        const product = { id, name, price, category, image, status: 'available' };
        // Salvar e renderizar
        saveProductToStorage(product);
        const grid = document.querySelector('.produtos-grid');
        if (grid) {
            grid.insertAdjacentHTML('beforeend', productCardHTML(product));
            setupCartFunctionality();
            applySoldStateToCatalog();
            applySavedPriceChanges();
            updateAdminStats();
        }
        close();
        showNotification(`Produto "${name}" adicionado!`, 'success');
    };
}