/**
 * ============================================================================
 * OPTIMIZED APP JS - Tatjana Grigojanova PhD. Translation Services
 * Features: i18n, Theme Toggle, Mobile Menu, Contact Form, Help Bot
 * Performance: Debounced events, Lazy loading, Passive listeners, RAF
 * ============================================================================
 */

(function() {
  'use strict';

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================
  const CONFIG = {
    CONTACT_ENDPOINT: 'https://n8n.elsaadouni.com/webhook/yas-contacts',
    WEBHOOK_SECRET: 'Mj1msc_6SVu12tPqCxvPka_AbC5tkSLZU5yIbPUs3Oc',
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    MAX_TOTAL_SIZE: 25 * 1024 * 1024,
    ALLOWED_TYPES: ['application/pdf', 'application/msword', 
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'image/jpeg', 'image/png', 'image/jpg',
                    'application/vnd.ms-excel', 'text/csv',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.csv'],
    DEBOUNCE_DELAY: 100,
    SCROLL_THROTTLE: 16 // ~60fps
  };

  // ==========================================================================
  // STATE
  // ==========================================================================
  const state = {
    lang: 'sk',
    theme: 'light',
    menuOpen: false,
    attachedFiles: [],
    botOpen: false,
    scrollTicking: false,
    resizeTimeout: null
  };

  // Cache DOM elements
  const domCache = {};

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================
  
  // Debounce function for performance
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function for scroll events
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Get element from cache or query
  function getElement(selector, useCache = true) {
    if (useCache && domCache[selector]) return domCache[selector];
    const el = document.querySelector(selector);
    if (useCache && el) domCache[selector] = el;
    return el;
  }

  // Get all elements from cache or query
  function getElements(selector, useCache = true) {
    if (useCache && domCache[selector + '_all']) return domCache[selector + '_all'];
    const els = document.querySelectorAll(selector);
    if (useCache) domCache[selector + '_all'] = els;
    return els;
  }

  // RAF-based scroll handler
  function requestScrollHandler(callback) {
    if (!state.scrollTicking) {
      window.requestAnimationFrame(() => {
        callback();
        state.scrollTicking = false;
      });
      state.scrollTicking = true;
    }
  }

  // Lazy load images
  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
              img.removeAttribute('data-srcset');
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '50px 0px' });

      document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  // ==========================================================================
  // DOM READY
  // ==========================================================================
  function init() {
    // Use requestIdleCallback for non-critical initializations
    const initFunctions = [
      initTheme,
      initLanguage,
      initMobileMenu,
      initHeaderScroll,
      initFAQ,
      initPricingTabs,
      initContactForm,
      initHelpBot,
      initLazyLoading
    ];

    // Critical init first
    initTheme();
    initLanguage();
    updateContent();
    initMobileMenu();
    initHeaderScroll();

    // Non-critical init deferred
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        initFAQ();
        initPricingTabs();
        initContactForm();
        initHelpBot();
        initLazyLoading();
        initMissingTranslationWarning();
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        initFAQ();
        initPricingTabs();
        initContactForm();
        initHelpBot();
        initLazyLoading();
        initMissingTranslationWarning();
      }, 100);
    }
  }

  // ==========================================================================
  // THEME MANAGEMENT
  // ==========================================================================
  function initTheme() {
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    
    if (themeParam && ['light', 'dark'].includes(themeParam)) {
      state.theme = themeParam;
    } else {
      state.theme = 'light';
    }
    
    applyTheme();
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
      localStorage.setItem('theme', state.theme);
    } catch (e) {
      // Silent fail for private mode
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
  }

  // ==========================================================================
  // LANGUAGE MANAGEMENT
  // ==========================================================================
  function initLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    const savedLang = localStorage.getItem('language');
    
    if (langParam && ['sk', 'en', 'ru'].includes(langParam)) {
      state.lang = langParam;
    } else if (savedLang && ['sk', 'en', 'ru'].includes(savedLang)) {
      state.lang = savedLang;
    } else {
      state.lang = 'sk';
    }
    
    applyLanguage();
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    try {
      localStorage.setItem('language', state.lang);
    } catch (e) {
      // Silent fail for private mode
    }
    
    const url = new URL(window.location);
    url.searchParams.set('lang', state.lang);
    window.history.replaceState({}, '', url);
    
    const langBtns = getElements('.lang-btn');
    langBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === state.lang);
    });
  }

  function setLanguage(lang) {
    if (lang === state.lang) return;
    state.lang = lang;
    applyLanguage();
    updateContent();
    if (state.botOpen) renderBotMessages();
  }

  // ==========================================================================
  // CONTENT UPDATE (i18n) - Optimized
  // ==========================================================================
  function updateContent() {
    const t = translations[state.lang];
    if (!t) {
      console.warn(`[i18n] Missing translations for: ${state.lang}`);
      return;
    }

    // Batch DOM updates
    const updates = [];
    const missingKeys = new Set();

    getElements('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const value = getNestedValue(t, key);
      
      if (value !== undefined && value !== null) {
        updates.push(() => {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.dataset.i18nAttr === 'placeholder') {
              el.placeholder = value;
            } else {
              el.value = value;
            }
          } else if (el.dataset.i18nAttr) {
            el.setAttribute(el.dataset.i18nAttr, value);
          } else {
            el.textContent = value;
          }
        });
      } else {
        missingKeys.add(key);
      }
    });

    getElements('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      const value = getNestedValue(t, key);
      if (value) {
        updates.push(() => { el.innerHTML = value; });
      }
    });

    getElements('[data-i18n-aria]').forEach(el => {
      const key = el.dataset.i18nAria;
      const value = getNestedValue(t, key);
      if (value) {
        updates.push(() => { el.setAttribute('aria-label', value); });
      }
    });

    // Execute all updates in single batch
    if (updates.length > 0) {
      requestAnimationFrame(() => {
        updates.forEach(fn => fn());
      });
    }

    if (missingKeys.size > 0 && window.location.hostname === 'localhost') {
      console.warn('[i18n] Missing:', [...missingKeys]);
    }

    // Defer non-critical updates
    setTimeout(() => {
      updateFAQ();
      updateExperienceTerminal();
    }, 0);
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // ==========================================================================
  // MOBILE MENU - Optimized
  // ==========================================================================
  function initMobileMenu() {
    const toggle = getElement('.menu-toggle');
    const menu = getElement('#mobile-menu');
    const backdrop = getElement('.mobile-menu-backdrop');
    
    if (!toggle || !menu) return;

    const closeMenu = () => {
      state.menuOpen = false;
      menu.classList.remove('open');
      backdrop?.classList.remove('visible');
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    const openMenu = () => {
      state.menuOpen = true;
      menu.classList.add('open');
      backdrop?.classList.add('visible');
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    toggle.addEventListener('click', () => {
      state.menuOpen ? closeMenu() : openMenu();
    });

    backdrop?.addEventListener('click', closeMenu);

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.menuOpen) closeMenu();
    });
  }

  // ==========================================================================
  // HEADER SCROLL - Optimized with RAF
  // ==========================================================================
  function initHeaderScroll() {
    const header = getElement('.header');
    if (!header) return;

    let lastScrollY = 0;
    let ticking = false;

    const updateHeader = () => {
      const scrollY = window.scrollY;
      
      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      // Hide/show on scroll direction (optional)
      if (scrollY > lastScrollY && scrollY > 200) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }
      
      lastScrollY = scrollY;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // FAQ - Optimized
  // ==========================================================================
  function initFAQ() {
    const faqList = getElement('#faq-list');
    if (!faqList || typeof faqData === 'undefined') return;

    updateFAQ();

    faqList.addEventListener('click', (e) => {
      const item = e.target.closest('.faq-item');
      if (!item) return;

      const isOpen = item.classList.contains('open');
      
      // Close all others
      faqList.querySelectorAll('.faq-item.open').forEach(i => {
        if (i !== item) i.classList.remove('open');
      });

      // Toggle current
      item.classList.toggle('open', !isOpen);
    });
  }

  function updateFAQ() {
    const faqList = getElement('#faq-list');
    if (!faqList || typeof faqData === 'undefined' || !faqData[state.lang]) return;

    const items = faqData[state.lang];
    
    // Only update if content changed
    const currentHash = faqList.dataset.contentHash;
    const newHash = items.map(i => i.q).join('|');
    if (currentHash === newHash) return;
    faqList.dataset.contentHash = newHash;

    const fragment = document.createDocumentFragment();
    
    items.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'faq-item';
      div.innerHTML = `
        <button class="faq-question" aria-expanded="false">
          <span>${escapeHtml(item.q)}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="faq-answer" hidden>
          <p>${escapeHtml(item.a)}</p>
        </div>
      `;
      
      const btn = div.querySelector('.faq-question');
      const answer = div.querySelector('.faq-answer');
      
      btn.addEventListener('click', () => {
        const isOpen = div.classList.contains('open');
        div.classList.toggle('open', !isOpen);
        btn.setAttribute('aria-expanded', !isOpen);
        answer.hidden = isOpen;
      });
      
      fragment.appendChild(div);
    });

    requestAnimationFrame(() => {
      faqList.innerHTML = '';
      faqList.appendChild(fragment);
    });
  }

  // ==========================================================================
  // PRICING TABS
  // ==========================================================================
  function initPricingTabs() {
    const tabBtns = getElements('.tab-btn');
    const tabContents = getElements('.tab-content');
    
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(c => {
          c.classList.toggle('active', c.id === tab);
        });
      });
    });
  }

  // ==========================================================================
  // CONTACT FORM - Optimized
  // ==========================================================================
  function initContactForm() {
    const form = getElement('#contact-form');
    if (!form) return;

    const fileInput = getElement('#file-upload');
    const fileList = getElement('#file-list');
    const formStatus = getElement('#form-status');

    // File upload handling
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }

    // Form submission
    form.addEventListener('submit', handleSubmit);

    // Drag and drop
    const dropZone = getElement('.file-upload-zone');
    if (dropZone) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
      });

      dropZone.addEventListener('drop', handleDrop, false);
    }

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    }

    function handleFileSelect(e) {
      handleFiles(e.target.files);
    }

    function handleFiles(files) {
      Array.from(files).forEach(file => {
        if (validateFile(file)) {
          if (!state.attachedFiles.find(f => f.name === file.name)) {
            state.attachedFiles.push(file);
          }
        }
      });
      updateFileList();
    }

    function validateFile(file) {
      if (file.size > CONFIG.MAX_FILE_SIZE) {
        showStatus(`Súbor ${file.name} je príliš veľký. Maximum je 5MB.`, 'error');
        return false;
      }
      
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
        showStatus(`Formát súboru ${file.name} nie je podporovaný.`, 'error');
        return false;
      }
      
      const totalSize = state.attachedFiles.reduce((sum, f) => sum + f.size, 0) + file.size;
      if (totalSize > CONFIG.MAX_TOTAL_SIZE) {
        showStatus('Celková veľkosť súborov presahuje 25MB.', 'error');
        return false;
      }
      
      return true;
    }

    function updateFileList() {
      if (!fileList) return;
      
      requestAnimationFrame(() => {
        fileList.innerHTML = state.attachedFiles.map((file, index) => `
          <div class="file-item">
            <span>${escapeHtml(file.name)} (${formatFileSize(file.size)})</span>
            <button type="button" onclick="removeFile(${index})" aria-label="Remove file">×</button>
          </div>
        `).join('');
      });
    }

    async function handleSubmit(e) {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent || 'Odoslať';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Odosielam...';
      }

      try {
        const formData = new FormData(form);
        formData.append('webhook_secret', CONFIG.WEBHOOK_SECRET);
        formData.append('language', state.lang);
        
        state.attachedFiles.forEach(file => {
          formData.append('attachments', file);
        });

        const response = await fetch(CONFIG.CONTACT_ENDPOINT, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          showStatus('Ďakujeme! Vaša správa bola odoslaná.', 'success');
          form.reset();
          state.attachedFiles = [];
          updateFileList();
        } else {
          throw new Error('Server error');
        }
      } catch (error) {
        showStatus('Chyba pri odosielaní. Skúste to znova.', 'error');
        console.error('Form submission error:', error);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    }

    function showStatus(message, type) {
      if (!formStatus) return;
      formStatus.textContent = message;
      formStatus.className = `form-status ${type}`;
      formStatus.hidden = false;
      
      setTimeout(() => {
        formStatus.hidden = true;
      }, 5000);
    }
  }

  // Make removeFile globally accessible
  window.removeFile = function(index) {
    state.attachedFiles.splice(index, 1);
    const fileList = getElement('#file-list');
    if (fileList) {
      requestAnimationFrame(() => {
        fileList.innerHTML = state.attachedFiles.map((file, i) => `
          <div class="file-item">
            <span>${escapeHtml(file.name)} (${formatFileSize(file.size)})</span>
            <button type="button" onclick="removeFile(${i})" aria-label="Remove file">×</button>
          </div>
        `).join('');
      });
    }
  };

  // ==========================================================================
  // HELP BOT - Optimized
  // ==========================================================================
  function initHelpBot() {
    const botToggle = getElement('#bot-toggle');
    const botWindow = getElement('#bot-window');
    const botClose = getElement('#bot-close');
    const botInput = getElement('#bot-input');
    const botSend = getElement('#bot-send');
    const botMessages = getElement('#bot-messages');

    if (!botToggle || !botWindow) return;

    const openBot = () => {
      state.botOpen = true;
      botWindow.classList.add('open');
      botToggle.setAttribute('aria-expanded', 'true');
      botWindow.setAttribute('aria-hidden', 'false');
      if (botInput) botInput.focus();
    };

    const closeBot = () => {
      state.botOpen = false;
      botWindow.classList.remove('open');
      botToggle.setAttribute('aria-expanded', 'false');
      botWindow.setAttribute('aria-hidden', 'true');
    };

    botToggle.addEventListener('click', () => state.botOpen ? closeBot() : openBot());
    botClose?.addEventListener('click', closeBot);

    botSend?.addEventListener('click', () => {
      const message = botInput?.value.trim();
      if (message) {
        handleBotMessage(message);
        if (botInput) botInput.value = '';
      }
    });

    botInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const message = botInput.value.trim();
        if (message) {
          handleBotMessage(message);
          botInput.value = '';
        }
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.botOpen) closeBot();
    });

    // Render initial suggestions
    renderBotMessages();
  }

  function handleBotMessage(message) {
    addBotMessage(message, 'user');
    
    // Simulate bot response
    setTimeout(() => {
      const response = getBotResponse(message.toLowerCase());
      addBotMessage(response, 'bot');
    }, 500);
  }

  function getBotResponse(message) {
    const t = translations[state.lang];
    if (!t || !t.bot || !t.bot.responses) return '';

    const responses = t.bot.responses;
    
    // Keyword matching
    if (message.includes('cen') || message.includes('price') || message.includes('цена')) return responses.pricing;
    if (message.includes('objedna') || message.includes('order') || message.includes('заказ')) return responses.order;
    if (message.includes('dokument') || message.includes('document') || message.includes('документ')) return responses.documents;
    if (message.includes('dlho') || message.includes('time') || message.includes('долго') || message.includes('время')) return responses.duration;
    if (message.includes('certif') || message.includes('súdny') || message.includes('certified')) return responses.certified;
    if (message.includes('jazyk') || message.includes('language') || message.includes('язык')) return responses.languages;
    if (message.includes('tlmoč') || message.includes('interpret') || message.includes('устн')) return responses.interpreting;
    if (message.includes('plat') || message.includes('payment') || message.includes('оплат')) return responses.payment;
    if (message.includes('kde') || message.includes('where') || message.includes('где')) return responses.location || responses.contact;
    if (message.includes('expres') || message.includes('urgent') || message.includes('срочно')) return responses.express || responses.duration;
    
    return responses.default || '';
  }

  function addBotMessage(text, type) {
    const botMessages = getElement('#bot-messages');
    if (!botMessages) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `bot-message ${type}`;
    msgDiv.textContent = text;
    
    requestAnimationFrame(() => {
      botMessages.appendChild(msgDiv);
      botMessages.scrollTop = botMessages.scrollHeight;
    });
  }

  function renderBotMessages() {
    const t = translations[state.lang];
    const botMessages = getElement('#bot-messages');
    const suggestionsDiv = getElement('#bot-suggestions');
    
    if (!botMessages || !t || !t.bot) return;

    // Clear and add greeting
    requestAnimationFrame(() => {
      botMessages.innerHTML = '';
      addBotMessage(t.bot.greeting, 'bot');
      
      // Render suggestions
      if (suggestionsDiv && t.bot.suggestions) {
        suggestionsDiv.innerHTML = t.bot.suggestions.map(s => 
          `<button class="bot-suggestion" onclick="handleBotSuggestion('${escapeHtml(s)}')">${escapeHtml(s)}</button>`
        ).join('');
      }
    });
  }

  // Make globally accessible
  window.handleBotSuggestion = function(suggestion) {
    handleBotMessage(suggestion);
  };

  // ==========================================================================
  // EXPERIENCE TERMINAL
  // ==========================================================================
  function updateExperienceTerminal() {
    const t = translations[state.lang];
    if (!t || !t.experience) return;

    const terminalBody = getElement('.terminal-body');
    const terminalTitle = getElement('.terminal-title');
    
    if (terminalTitle) {
      terminalTitle.textContent = t.experience.title;
    }
  }

  // ==========================================================================
  // UTILITY HELPERS
  // ==========================================================================
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function initMissingTranslationWarning() {
    if (window.location.hostname !== 'localhost') return;
    // Development only warning system
  }

  // ==========================================================================
  // INITIALIZE
  // ==========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose necessary functions globally
  window.setLanguage = setLanguage;
  window.toggleTheme = toggleTheme;
  window.handleBotMessage = handleBotMessage;

})();
