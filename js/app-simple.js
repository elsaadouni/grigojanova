/**
 * Simple App JS - Tatjana Grigojanova PhD. Translation Services
 */

(function() {
  'use strict';

  // State
  const state = {
    lang: 'sk',
    theme: 'light'
  };

  // Initialize on DOM ready
  function init() {
    initTheme();
    initLanguage();
    initMobileMenu();
    updateContent();
  }

  // Theme
  function initTheme() {
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    state.theme = (themeParam === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
  }

  window.toggleTheme = function() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    try { localStorage.setItem('theme', state.theme); } catch(e) {}
  };

  // Language
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
    
    document.documentElement.lang = state.lang;
    
    // Update active buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === state.lang);
    });
  }

  window.setLanguage = function(lang) {
    if (lang === state.lang) return;
    state.lang = lang;
    document.documentElement.lang = state.lang;
    try { localStorage.setItem('language', state.lang); } catch(e) {}
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('lang', state.lang);
    window.history.replaceState({}, '', url);
    
    // Update content
    updateContent();
    
    // Update active buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === state.lang);
    });
  };

  // Content update
  function updateContent() {
    if (typeof translations === 'undefined') return;
    const t = translations[state.lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const value = getNestedValue(t, key);
      if (value) {
        if (el.tagName === 'INPUT' && el.dataset.i18nAttr === 'placeholder') {
          el.placeholder = value;
        } else {
          el.textContent = value;
        }
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      const value = getNestedValue(t, key);
      if (value) el.innerHTML = value;
    });
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Mobile menu
  function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('#mobile-menu');
    const backdrop = document.querySelector('.mobile-menu-backdrop');
    
    if (!toggle || !menu) return;

    function closeMenu() {
      menu.classList.remove('open');
      backdrop?.classList.remove('visible');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function openMenu() {
      menu.classList.add('open');
      backdrop?.classList.add('visible');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    toggle.addEventListener('click', function() {
      if (menu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    backdrop?.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Bot handler
  window.handleBotSuggestion = function(text) {
    console.log('Bot suggestion:', text);
  };

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
