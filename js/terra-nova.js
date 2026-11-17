// Terra Nova live components, copied from angelowellens.eu js/angelo.js
// (initDsBento, lines 2959-3933). Vanilla JS, no jQuery.

function initDsBento(root) {
  if (!root) return;
  root.querySelectorAll('[data-dsb]').forEach(function(box) {
    if (box.dataset.bound) return;
    box.dataset.bound = '1';
    var wrap = box.parentNode;
    var canvas = box.querySelector('[data-canvas]');
    var W = 1474, H = 2032;
    var q = function(s, el) { return (el || box).querySelector(s); };
    var qa = function(s, el) { return [].slice.call((el || box).querySelectorAll(s)); };
    // a click on empty project space closes the page; keep this one's clicks in
    // (site-only guard removed: on the portfolio a click on empty project space closes the page)

    // ── fit: whole width, or a readable minimum that scrolls sideways ──
    function fit() {
      var pw = wrap.clientWidth;
      if (!pw || getComputedStyle(box).display === 'none') return;
      var s = Math.max(pw / W, 0.62);
      canvas.style.transform = 'scale(' + s + ')';
      wrap.style.aspectRatio = 'auto';
      wrap.style.height = Math.ceil(H * s + (s > pw / W ? 14 : 0)) + 'px';
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
    else window.addEventListener('resize', fit);

    // ── toast ──
    var toastEl = q('[data-toast]'), toastT;
    function toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('is-on');
      clearTimeout(toastT);
      toastT = setTimeout(function() { toastEl.classList.remove('is-on'); }, 1700);
    }
    function copy(text) {
      try { navigator.clipboard.writeText(text); } catch (err) {}
      toast('Copied ' + text);
    }
    function flash(els) {
      els.forEach(function(el) { if (!el) return; el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash'); });
    }

    // ── properties panels: one per tile, opened by its gear ──
    var props = {};   // tile key → function(prop, value)
    function closePanels(except) {
      qa('[data-pp]').forEach(function(p) {
        if (p === except) return;
        p.classList.remove('is-open');
        var g = q('[data-gear]', p.parentNode);
        g.classList.remove('is-on');
        g.setAttribute('aria-expanded', 'false');
      });
    }
    qa('[data-gear]').forEach(function(g) {
      var tile = g.parentNode, panel = q('[data-pp]', tile), key = tile.dataset.tile;
      g.addEventListener('click', function() {
        var open = !panel.classList.contains('is-open');
        closePanels(panel);
        panel.classList.toggle('is-open', open);
        g.classList.toggle('is-on', open);
        g.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      qa('[data-p]', panel).forEach(function(c) {
        var fire = function() {
          var v = c.type === 'checkbox' ? c.checked : c.value;
          if (props[key]) props[key](c.dataset.p, v);
        };
        c.addEventListener(c.type === 'text' ? 'input' : 'change', fire);
      });
    });
    // ── spacing guides: a button beside each gear outlines the component and
    // labels its padding and the gaps between its children, to show the
    // spacing sits on the 2, 4, 8, 12, 16… scale ──
    var GUIDE_SVG = '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="8" y="8" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 2"/></svg>';
    qa('[data-gear]').forEach(function(g) {
      var tile = g.parentNode, layer = null, raf = 0;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dsb-gear dsb-guide';
      b.setAttribute('aria-label', 'Spacing guides');
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = GUIDE_SVG;
      tile.insertBefore(b, g);

      function draw() {
        raf = 0;
        if (!b.classList.contains('is-on')) return;
        if (layer) layer.remove();
        layer = document.createElement('div');
        layer.className = 'dsb-guides';
        layer.setAttribute('aria-hidden', 'true');
        var tr = tile.getBoundingClientRect(), s = tr.width / tile.offsetWidth, n = 0;
        function rect(el) {
          var r = el.getBoundingClientRect();
          return { x: (r.left - tr.left) / s - tile.clientLeft, y: (r.top - tr.top) / s - tile.clientTop, w: r.width / s, h: r.height / s };
        }
        function add(cls, x, y, w, h) {
          var d = document.createElement('div');
          d.className = cls;
          d.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px';
          layer.appendChild(d);
        }
        function label(v, x, y) {
          var d = document.createElement('span');
          d.className = 'dsb-gd-n';
          d.textContent = Math.round(v);
          d.style.cssText = 'left:' + x + 'px;top:' + y + 'px';
          layer.appendChild(d);
        }
        function walk(el, depth) {
          if (n > 80 || !el.getClientRects().length) return;
          var r = rect(el), cs = getComputedStyle(el);
          if (r.w < 12 || r.h < 12 || cs.visibility === 'hidden' || cs.opacity === '0') return;
          n++;
          add('dsb-gd-box', r.x, r.y, r.w, r.h);
          var pt = parseFloat(cs.paddingTop), pr = parseFloat(cs.paddingRight), pb = parseFloat(cs.paddingBottom), pl = parseFloat(cs.paddingLeft);
          if (pt) { add('dsb-gd-pad', r.x, r.y, r.w, pt); if (pt >= 4) label(pt, r.x + r.w / 2, r.y + pt / 2); }
          if (pb) { add('dsb-gd-pad', r.x, r.y + r.h - pb, r.w, pb); if (pb >= 4) label(pb, r.x + r.w / 2, r.y + r.h - pb / 2); }
          if (pl) { add('dsb-gd-pad', r.x, r.y + pt, pl, r.h - pt - pb); if (pl >= 4) label(pl, r.x + pl / 2, r.y + r.h / 2); }
          if (pr) { add('dsb-gd-pad', r.x + r.w - pr, r.y + pt, pr, r.h - pt - pb); if (pr >= 4) label(pr, r.x + r.w - pr / 2, r.y + r.h / 2); }
          var kids = [].filter.call(el.children, function(c) { return c.getClientRects().length && getComputedStyle(c).position !== 'absolute'; });
          if (/flex|grid/.test(cs.display)) {
            for (var i = 1; i < kids.length; i++) {
              var a = rect(kids[i - 1]), c = rect(kids[i]), top, h, left, w;
              if (c.x >= a.x + a.w - 1) {
                left = a.x + a.w; w = c.x - left; top = Math.max(a.y, c.y); h = Math.min(a.y + a.h, c.y + c.h) - top;
              } else if (c.y >= a.y + a.h - 1) {
                top = a.y + a.h; h = c.y - top; left = Math.max(a.x, c.x); w = Math.min(a.x + a.w, c.x + c.w) - left;
              } else continue;
              var v = c.x >= a.x + a.w - 1 ? w : h;
              // a big gap that isn't the set gap is free space (space-between,
              // a spacer), not a spacing value
              if (Math.min(w, h) < 1.5 || Math.max(w, h) < 4 || (v > 40 && Math.abs(v - (parseFloat(c.x >= a.x + a.w - 1 ? cs.columnGap : cs.rowGap) || 0)) > 1)) continue;
              add('dsb-gd-gap', left, top, w, h);
              label(v, left + w / 2, top + h / 2);
            }
          }
          if (depth < 3) kids.forEach(function(c) { walk(c, depth + 1); });
        }
        [].forEach.call(tile.children, function(el) {
          if (!el.matches('.dsb-tile-l, .dsb-gear, [data-pp], .dsb-guides')) walk(el, 0);
        });
        tile.appendChild(layer);
      }
      function redraw() { if (layer && !raf) raf = requestAnimationFrame(draw); }
      // the autoplay demo changes the tile without clicks: follow it while on
      var isLayer = function(n) { return n && n.nodeType === 1 && (n.classList.contains('dsb-guides') || n.closest('.dsb-guides')); };
      var mo = window.MutationObserver && new MutationObserver(function(ms) {
        for (var i = 0; i < ms.length; i++) {
          var m = ms[i];
          if (isLayer(m.target) || [].some.call(m.addedNodes, isLayer) || [].some.call(m.removedNodes, isLayer)) continue;
          return redraw();
        }
      });
      b.addEventListener('click', function() {
        var on = !layer;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) { draw(); if (mo) mo.observe(tile, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected', 'style'] }); }
        else { if (mo) mo.disconnect(); if (raf) { cancelAnimationFrame(raf); raf = 0; } layer.remove(); layer = null; }
      });
      // components change as they're used: redraw once things settle
      ['click', 'input', 'change', 'transitionend'].forEach(function(t) {
        tile.addEventListener(t, function(e) { if (e.target !== b) setTimeout(redraw, t === 'click' ? 350 : 0); });
      });
    });
    box.addEventListener('click', function(e) {
      if (!e.target.closest('[data-pp], [data-gear]')) closePanels();
      if (!e.target.closest('[data-year]')) year.classList.remove('is-open');
    });
    box.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && q('[data-pp].is-open')) { e.stopPropagation(); closePanels(); }
    });

    // ── navigation ──
    var side = q('[data-side]');
    var year = q('[data-year]'), yearVal = q('[data-year-val]');
    var co = q('[data-co]'), coBtn = q('[data-co-btn]'), coQ = q('[data-co-q]'), coSel = q('[data-tile="side"] [data-p="company"]');
    function setCo(open) {
      co.classList.toggle('is-open', open);
      coBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { year.classList.remove('is-open'); coQ.value = ''; filterCo(''); }
    }
    function filterCo(v) {
      var n = 0;
      qa('[data-co-i]', co).forEach(function(b) {
        var hit = b.dataset.name.toLowerCase().indexOf(v.toLowerCase()) > -1;
        b.hidden = !hit;
        if (hit) n++;
      });
      q('[data-co-none]', co).hidden = n > 0;
    }
    function pickCo(b) {
      qa('[data-co-i]', co).forEach(function(x) { x.classList.toggle('is-on', x === b); });
      q('[data-co-name]').textContent = b.dataset.name;
      q('[data-co-av]').style.backgroundImage = q('.dsb-co-av', b).style.backgroundImage;
      coSel.value = b.dataset.name;
    }
    coBtn.addEventListener('click', function() { setCo(!co.classList.contains('is-open')); });
    coQ.addEventListener('input', function() { filterCo(coQ.value.trim()); });
    qa('[data-co-i]', co).forEach(function(b) {
      b.addEventListener('click', function() {
        var same = b.classList.contains('is-on');
        pickCo(b); setCo(false);
        if (!same) toast('Switched to ' + b.dataset.name);
      });
    });
    q('[data-co-out]').addEventListener('click', function() { setCo(false); toast('Logged out \u2014 not really, it\u2019s a demo'); });
    box.addEventListener('click', function(e) { if (!e.target.closest('[data-co]')) setCo(false); });
    box.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && co.classList.contains('is-open')) { e.stopPropagation(); setCo(false); coBtn.focus(); }
    });
    q('[data-year-btn]').addEventListener('click', function() { setCo(false); year.classList.toggle('is-open'); });
    qa('[data-y]', year).forEach(function(b) {
      b.addEventListener('click', function() {
        qa('[data-y]', year).forEach(function(x) { x.classList.toggle('is-on', x === b); });
        yearVal.textContent = b.dataset.y;
        q('[data-year-short]').textContent = b.dataset.y.slice(-2);
        year.classList.remove('is-open');
      });
    });
    var group = q('[data-group]');
    qa('[data-nav]').forEach(function(b) {
      b.addEventListener('click', function() {
        var g = b.hasAttribute('data-group-toggle') && b.closest('[data-group]');
        if (g && b.classList.contains('is-active')) {
          g.classList.toggle('is-open');
          return;
        }
        qa('[data-nav]').forEach(function(x) { x.classList.toggle('is-active', x === b); });
        if (g) g.classList.add('is-open');
      });
    });
    // collapse / expand from the button at the bottom, kept in step with the State property
    var fold = q('[data-fold]'), expSel = q('[data-tile="side"] [data-p="expanded"]');
    var railT;
    function setRail(rail) {
      setCo(false); year.classList.remove('is-open');
      side.classList.toggle('is-rail', rail);
      // popovers may escape the nav, but only once the width has settled
      clearTimeout(railT);
      side.classList.remove('is-settled');
      railT = setTimeout(function() { side.classList.add('is-settled'); }, 320);
      fold.setAttribute('aria-expanded', rail ? 'false' : 'true');
      fold.setAttribute('aria-label', rail ? 'Expand menu' : 'Collapse menu');
      expSel.value = rail ? 'Collapsed' : 'Expanded';
    }
    fold.addEventListener('click', function() { setRail(!side.classList.contains('is-rail')); });
    props.side = function(p, v) {
      if (p === 'expanded') setRail(v === 'Collapsed');
      if (p === 'company') qa('[data-co-i]', co).forEach(function(b) { if (b.dataset.name === v) pickCo(b); });
      if (p === 'icon') side.classList.toggle('is-noicon', !v);
      flash([side]);
    };

    // ── multi-select ──
    var ms = q('[data-ms]'), chips = q('[data-ms-chips]'), msValue = q('[data-ms-value]');
    var opts = qa('[data-opt]', ms);
    function selected() { return opts.filter(function(o) { return o.getAttribute('aria-selected') === 'true'; }).map(function(o) { return o.dataset.opt; }); }
    function renderChips() {
      var sel = selected();
      chips.innerHTML = '';
      sel.slice(0, 2).forEach(function(v) {
        var c = document.createElement('span');
        c.className = 'dsb-chip';
        c.innerHTML = v + '<i role="button" aria-label="Remove ' + v + '"><svg><use href="#dsi-close-line"/></svg></i>';
        c.querySelector('i').addEventListener('click', function(e) {
          e.stopPropagation();
          setOpt(v, false);
        });
        chips.appendChild(c);
      });
      if (ctp) ctpClose();
      if (sel.length > 2) {
        // a span, not a button: the chips sit inside the field's own button
        var m = document.createElement('span');
        m.className = 'dsb-chip dsb-chip--more';
        m.textContent = '+' + (sel.length - 2);
        m.setAttribute('role', 'button'); m.tabIndex = 0;
        m.setAttribute('data-more', '');
        m.setAttribute('aria-label', 'Show ' + (sel.length - 2) + ' more selected');
        m._more = sel.slice(2); m._noun = 'selected';
        bindMore(m);
        chips.appendChild(m);
      }
      msValue.textContent = sel[0] || 'Select';
    }
    function setOpt(v, on) {
      var single = ms.dataset.mode === 'Single';
      opts.forEach(function(o) {
        if (o.dataset.opt === v) o.setAttribute('aria-selected', on ? 'true' : 'false');
        else if (single && on) o.setAttribute('aria-selected', 'false');
      });
      renderChips();
    }
    opts.forEach(function(o) {
      o.addEventListener('click', function() {
        var on = o.getAttribute('aria-selected') !== 'true';
        if (ms.dataset.mode === 'Single' && !on) return;
        setOpt(o.dataset.opt, on);
      });
    });
    q('[data-ms-field]').addEventListener('click', function() { ms.classList.toggle('is-open'); });
    var help = q('[data-ms-help]');
    function helpCopy() {
      help.textContent = ms.dataset.state === 'Error' ? 'Select at least one fund to continue' : 'Pick the funds to report on';
    }
    props.select = function(p, v) {
      if (p === 'mode') {
        ms.dataset.mode = v;
        q('.dsb-ms-menu', ms).setAttribute('aria-multiselectable', v === 'Multiple' ? 'true' : 'false');
        if (v === 'Single') { var first = selected()[0] || opts[0].dataset.opt; setOpt(first, true); }
        renderChips();
      }
      if (p === 'size') ms.dataset.size = v;
      if (p === 'state') { ms.dataset.state = v; helpCopy(); }
      if (p === 'copy') q('[data-ms-copy]').textContent = v;
      if (p === 'help') help.hidden = !v;
      flash([q('[data-ms-field]')]);
    };
    helpCopy();
    renderChips();

    // ── colours + type: click copies ──
    qa('[data-copy]').forEach(function(b) {
      b.addEventListener('click', function() { copy(b.dataset.copy); });
    });

    // ── icons: click switches one icon's Style; the panel switches them all ──
    function setIconStyle(b, style) {
      b.dataset.style = 'Style=' + style;
      b.classList.add('flip');
      setTimeout(function() {
        q('use', b).setAttribute('href', '#dsi-' + b.dataset.icon + (style === 'Outlined' ? '-line' : '-fill'));
        b.classList.remove('flip');
      }, 120);
    }
    qa('[data-icon]').forEach(function(b) {
      b.dataset.style = 'Style=Filled';
      b.addEventListener('click', function() {
        setIconStyle(b, b.dataset.style === 'Style=Filled' ? 'Outlined' : 'Filled');
      });
    });
    props.icons = function(p, v) {
      if (p === 'style') qa('[data-icon]').forEach(function(b, i) { setTimeout(function() { setIconStyle(b, v); }, i * 50); });
    };

    // ── Figma: pages + library ──
    qa('[data-pages] button').forEach(function(b, i, all) {
      b.addEventListener('click', function() { all.forEach(function(x) { x.classList.toggle('is-on', x === b); }); });
    });

    // ── variables: Figma's Variables view. Spacing and Corner-Radius values drive the canvas ──
    // (Product Brand 600-50 and its DGN Blue column are filled in to complete the ramp)
    var VARS = {'spacing':{'title':'1. Spacing','modes':['Value'],'groups':[{'p':[],'r':[['spacing-xxs',4],['spacing-xs',8],['spacing-s',12],['spacing-m',16],['spacing-l',24],['spacing-xl',32],['spacing-2x',40],['spacing-3x',48],['spacing-4x',64],['spacing-5x',80],['spacing-6x',120]]}]},'radius':{'title':'2. Corner-Radius','modes':['Value'],'groups':[{'p':[],'r':[['radius-xxs',4],['radius-xs',8],['radius-s',12],['radius-m',16],['radius-l',24],['radius-xl',32]]}]},'product':{'title':'3. Product Colors','modes':['Light','DGN Blue','Dark Mode'],'groups':[{'p':['Product','Essentials'],'r':[['White','FFFFFF','FFFFFF','1F1F1F'],['Black','000000','000000','FFFFFF']]},{'p':['Product','Neutrals','Grey'],'r':[['950','282727','282727','F8F8F8'],['900','333333','4E4E4E','F0F0F0'],['800','4E4E4E','6B6A6A','E4E4E4'],['700','6B6A6A','6B6A6A','D1D0D0'],['600','828080','828080','B5B4B4'],['500','A4A3A3','A4A3A3','A4A3A3'],['400','B5B4B4','B5B4B4','828080'],['300','D1D0D0','D1D0D0','6B6A6A'],['200','E4E4E4','E4E4E4','4E4E4E'],['100','F0F0F0','F0F0F0','333333'],['50','F8F8F8','F8F8F8','282727']]},{'p':['Product','Primary','Brand'],'r':[['950','35096C','001B39','F5F2FF'],['900','57139F','002147','EEE7FF'],['800','6815C2','002855','DFD3FF'],['700-P','7516DA','002F64','C8AFFF'],['600','8A3FF0','004A9E','B18CFF'],['500','974FFF','2563C4','974FFF'],['400','B18CFF','5B8FDB','8A3FF0'],['300','C8AFFF','93B8EC','7516DA'],['200','DFD3FF','BFD5F5','6815C2'],['100','EEE7FF','DEE9FA','57139F'],['50','F5F2FF','F0F5FD','35096C']]},{'p':['Product','Sentiment','Green'],'r':[['950','1B3121','052E16','FAFCFA'],['900','305A3A','14532D','F3F9F3'],['800','3B6B46','166534','E9F1E9'],['700','468654','15803D','D7E6D9'],['600','56A968','16A34A','B8D0BB'],['500','8BBF94','22C55E','8BBF94'],['400','B8D0BB','4ADE80','56A968'],['300','D7E6D9','86EFAC','468654'],['200','E9F1E9','BBF7D0','3B6B46'],['100','F3F9F3','DCFCE7','305A3A'],['50','FAFCFA','F0FDF4','1B3121']]},{'p':['Product','Sentiment','Blue'],'r':[['950','1F2D63','172554','F3F8FE'],['900','2B46A0','1E3A8A','E5EEFC'],['800','2E4DCA','1E40AF','CFE2FB'],['700','4D6EDC','1D4ED8','AFCFF8'],['600','6287E7','2563EB','9AC0F5'],['500','80A7F1','3B82F6','80A7F1'],['400','9AC0F5','60A5FA','6287E7'],['300','AFCFF8','93C5FD','4D6EDC'],['200','CFE2FB','BFDBFE','2E4DCA'],['100','E5EEFC','DBEAFE','2B46A0'],['50','F3F8FE','EFF6FF','1F2D63']]},{'p':['Product','Sentiment','Red'],'r':[['950','3D1812','450A0A','FCF5F4'],['900','71352B','7F1D1D','FAE9E6'],['800','A24333','991B1B','FAE9E6'],['700','C25340','B91C1C','F7D6D1'],['600','D56957','DC2626','EFBBB2'],['500','E59284','EF4444','E59284'],['400','EFBBB2','F87171','D56957'],['300','F7D6D1','FCA5A5','C25340'],['200','FAE9E6','FECACA','A24333'],['100','FAE9E6','FEE2E2','71352B'],['50','FCF5F4','FEF2F2','3D1812']]},{'p':['Product','Sentiment','Yellow'],'r':[['950','674100','422006','FFFDF4'],['900','955C11','713F12','FFF9DD'],['800','BA7526','854D0E','FFF1AA'],['700','D58C40','A16207','FFEA95'],['600','F1A944','CA8A04','FFDF7C'],['500','FFCE6E','EAB308','FFCE6E'],['400','FFDF7C','FACC15','F1A944'],['300','FFEA95','FDE047','D58C40'],['200','FFF1AA','FEF08A','BA7526'],['100','FFF9DD','FEF9C3','955C11'],['50','FFFDF4','FEFCE8','674100']]}]},'marketing':{'title':'4. Marketing Colors','modes':['Light','DGN'],'groups':[{'p':['Brand','Primary','Brand'],'r':[['Default','7516DA','FF6500'],['Medium','974FFF','FF9C32'],['Light','C8AFFF','FFDCA5']]},{'p':['Brand','Secondary','Green'],'r':[['Default','468654','15803D'],['Medium','8BBF94','22C55E'],['Light','D7E6D9','86EFAC']]},{'p':['Brand','Secondary','Blue'],'r':[['Default','4D6EDC','1D4ED8'],['Medium','80A7F1','3B82F6'],['Light','AFCFF8','93C5FD']]},{'p':['Brand','Tertiary','Red'],'r':[['Default','C25340','B91C1C'],['Medium','E59284','EF4444'],['Light','F7D6D1','FCA5A5']]},{'p':['Brand','Tertiary','Yellow'],'r':[['Default','D58C40','A16207'],['Medium','FFCE6E','EAB308'],['Light','FFEA95','FDE047']]}]}};
    var varVals = {}, defaults = {};
    VARS.spacing.groups[0].r.concat(VARS.radius.groups[0].r).forEach(function(v) { varVals[v[0]] = defaults[v[0]] = v[1]; });
    var scrollEl = q('[data-var-scroll]'), groupsEl = q('[data-var-groups]'), curCol = 'spacing', curGroup = {};
    function varTree(C) {
      var nodes = [], seen = {};
      C.groups.forEach(function(g) {
        for (var d = 1; d <= g.p.length; d++) {
          var key = g.p.slice(0, d).join('/');
          if (!seen[key]) { seen[key] = { key: key, name: g.p[d - 1], depth: d, n: 0 }; nodes.push(seen[key]); }
          seen[key].n += g.r.length;
        }
      });
      return nodes;
    }
    function inGroup(g, key) { var k = g.p.join('/'); return !key || k === key || k.indexOf(key + '/') === 0; }
    function renderVars() {
      var C = VARS[curCol], key = curGroup[curCol] || '', num = curCol === 'spacing' || curCol === 'radius', max = curCol === 'radius' ? 64 : 160;
      var total = C.groups.reduce(function(a, g) { return a + g.r.length; }, 0);
      q('[data-var-title]').textContent = C.title;
      groupsEl.innerHTML = '<button type="button" data-vgrp=""' + (key ? '' : ' class="is-on"') + '><span>All</span><i>' + total + '</i></button>' +
        varTree(C).map(function(nd) {
          return '<button type="button" data-vgrp="' + nd.key + '"' + (nd.key === key ? ' class="is-on"' : '') + ' style="padding-left:' + (8 + nd.depth * 14) + 'px"><span>' + nd.name + '</span><i>' + nd.n + '</i></button>';
        }).join('');
      qa('[data-vgrp]', groupsEl).forEach(function(b) { b.addEventListener('click', function() { setGroup(b.dataset.vgrp); }); });
      scrollEl.style.setProperty('--vcols', '200px repeat(' + C.modes.length + ', ' + (num ? '220px' : '170px') + ')');
      var h = '<div class="dsb-vrow dsb-vhead"><span>Name</span>' + C.modes.map(function(m) { return '<span>' + m + '</span>'; }).join('') + '</div>', i = 0;
      C.groups.forEach(function(g) {
        if (!inGroup(g, key)) return;
        if (g.p.length) h += '<div class="dsb-vgh">' + g.p.slice(0, -1).map(function(x) { return x + ' / '; }).join('') + '<b>' + g.p[g.p.length - 1] + '</b></div>';
        g.r.forEach(function(v) {
          h += '<div class="dsb-vrow dsb-var" style="animation-delay:' + (Math.min(i++, 14) * 18) + 'ms"><span class="dsb-var-n">' +
            (num ? '<svg class="hash"><use href="#dsi-hashtag"/></svg>' : '<svg><use href="#dsi-palette"/></svg>') + v[0] + '</span>' +
            (num ? '<span><input type="number" min="0" max="' + max + '" step="1" aria-label="' + v[0] + '" data-vname="' + v[0] + '"></span>'
                 : v.slice(1).map(function(hex) { return '<span class="dsb-vc" data-hex="' + hex + '"><i style="background:#' + hex + '"></i>' + hex + '</span>'; }).join('')) +
            '</div>';
        });
      });
      h += '<div class="dsb-vadd"><svg><use href="#dsi-add-line"/></svg>Create variable</div>';
      scrollEl.innerHTML = h;
      scrollEl.scrollTop = 0;
      qa('input[data-vname]', scrollEl).forEach(function(inp) {
        var n0 = inp.dataset.vname, row = inp.closest('.dsb-var');
        inp.value = varVals[n0];
        row.classList.toggle('is-changed', varVals[n0] !== defaults[n0]);
        inp.addEventListener('input', function() {
          var n = parseFloat(inp.value);
          if (isNaN(n)) return;
          varVals[n0] = Math.max(0, Math.min(max, n));
          row.classList.toggle('is-changed', varVals[n0] !== defaults[n0]);
          box.style.setProperty('--' + n0, varVals[n0] + 'px');
        });
      });
      qa('[data-hex]', scrollEl).forEach(function(c) { c.addEventListener('click', function() { copy('#' + c.dataset.hex); }); });
    }
    function setGroup(key) { curGroup[curCol] = key; renderVars(); }
    qa('[data-col]').forEach(function(b, i, all) {
      b.addEventListener('click', function() {
        all.forEach(function(x) { x.classList.toggle('is-on', x === b); });
        curCol = b.dataset.col;
        renderVars();
      });
    });
    renderVars();

    // ── card ──
    var card = q('[data-card]'), finBar = q('[data-fin-bar]');
    function fillFin() { finBar.style.width = (78 / 244 * 100) + '%'; }
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function(es) {
        es.forEach(function(en) { if (en.isIntersecting) { fillFin(); io.disconnect(); } });
      }, { threshold: 0.6 });
      io.observe(card);
    } else fillFin();
    props.card = function(p, v) {
      var el = q('[data-c="' + p + '"]', card);
      el.hidden = !v;
      card.classList.toggle('no-user', !!q('[data-c="user"][hidden]', card));
      if (v) flash([el]);
    };
    q('[data-card-open]').addEventListener('click', function() { toast('Opens the Financials section'); });

    // ── table ──
    var table = q('[data-table]');
    var head = q('[data-t-head]'), body = q('[data-t-body]');
    var COLS = [
      { k: 'name', label: 'Entity', w: 260, ic: 'tni-building-line' },
      { k: 'type', label: 'Type', w: 130, ic: 'hashtag' },
      { k: 'parent', label: 'Parent entity', w: 170, ic: 'stack-fill' },
      { k: 'contacts', label: 'Contact(s)', w: 300, ic: 'user-line' },
      { k: 'done', label: 'Data collected', w: 180, ic: 'tni-datacol-line' },
      { k: 'em', label: 'Emissions', w: 180, num: true, unit: 'tCO2e', ic: 'tni-carbon-line' },
      { k: 'rev', label: 'Revenue', w: 190, num: true, unit: 'EUR', ic: 'money-euro-box-fill' }
    ];
    var PEOPLE = ['Lena Weber', 'Tom Fischer', 'Ana Costa', 'Jonas Berg', 'Mira Koch', 'Sam Okafor', 'Ines Ruiz', 'Paul Meyer', 'Noor Haddad'];
    var ROWS = [
      ['Northwind Capital', 'Fund', 212, 1205.0, 48200000], ['Helios Energy', 'Company', 244, 3234.0, 12600000],
      ['Baltic Bank', 'Bank', 96, 363.0, 220400000], ['Greenline Logistics', 'Company', 43, 2230.0, 8350000],
      ['Atlas Ventures II', 'Fund', 178, 14.0, 31000000], ['Meridian Foods', 'Company', 130, 564.0, 5640000],
      ['Corvus Infra Fund', 'Fund', 201, 809.0, 76100000], ['Oak & Stone Bank', 'Bank', 61, 100.0, 140000000],
      ['Solace Health', 'Company', 88, 234.0, 2340000], ['Tidal Wind Partners', 'Fund', 244, 50.0, 18800000],
      ['Vela Materials', 'Company', 12, 1902.5, 9900000], ['Union Coop Bank', 'Bank', 150, 72.4, 98300000],
      ['Brightpath Schools', 'Company', 199, 41.0, 1200000], ['Lumen Growth III', 'Fund', 230, 365.8, 54000000],
      ['Kestrel Mobility', 'Company', 67, 980.0, 7100000], ['Hanse Savings Bank', 'Bank', 112, 210.0, 66500000],
      ['Fjord Aquaculture', 'Company', 154, 612.3, 4300000], ['Evergreen Impact', 'Fund', 240, 9.5, 23700000]
    ].map(function(r, i) {
      var cs = [];
      for (var j = 0; j < (i * 5) % 6; j++) cs.push(PEOPLE[(i * 3 + j * 5) % PEOPLE.length]);
      return { id: i, name: r[0], type: r[1], done: r[2], em: r[3], rev: r[4], parent: 'Fund ' + ((i * 7) % 17 + 1), contacts: cs };
    });
    var saved = ROWS.map(function(r) { return { em: r.em, rev: r.rev }; });
    var tState = { tab: 'all', q: '', sort: null, desc: false, page: 0, sel: {}, edits: {} };
    var PER = 6;
    var fmt = function(n, k) { return k === 'rev' ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };

    function renderHead() {
      head.innerHTML = '<tr>' + COLS.map(function(c, i) {
        var cls = (c.num ? 'num ' : '') + (tState.sort === c.k ? 'is-sort' + (tState.desc ? ' is-desc' : '') : '');
        return '<th class="' + cls + '" data-k="' + c.k + '" style="width:' + c.w + 'px"><span class="th-in">' + (i ? '' : '<span class="dsb-cb" data-t-all role="checkbox" aria-label="Select all rows"></span>') + '<svg><use href="#dsi-' + c.ic + '"/></svg>' + c.label + '<i><svg><use href="#dsi-arrow-down-s-line"/></svg></i></span></th>';
      }).join('') + '</tr>';
      q('[data-t-all]', head).addEventListener('click', function(e) {
        e.stopPropagation();
        var rows = view(), all = rows.every(function(r) { return tState.sel[r.id]; });
        rows.forEach(function(r) { if (all) delete tState.sel[r.id]; else tState.sel[r.id] = true; });
        renderBody();
      });
      qa('th', head).forEach(function(th) {
        th.addEventListener('click', function() {
          var k = th.dataset.k;
          if (tState.sort === k) { if (tState.desc) { tState.sort = null; tState.desc = false; } else tState.desc = true; }
          else { tState.sort = k; tState.desc = false; }
          renderHead(); renderBody();
        });
      });
    }
    // header checkbox: on when every visible row is selected, a dash when only some are
    function syncAll() {
      var cb = q('[data-t-all]', head); if (!cb) return;
      var rows = view(), n = rows.filter(function(r) { return tState.sel[r.id]; }).length;
      cb.classList.toggle('is-on', n > 0 && n === rows.length);
      cb.classList.toggle('is-mixed', n > 0 && n < rows.length);
      cb.setAttribute('aria-checked', n && n === rows.length ? 'true' : n ? 'mixed' : 'false');
    }
    function view() {
      var rows = ROWS.filter(function(r) {
        return (tState.tab === 'all' || r.type === tState.tab) && r.name.toLowerCase().indexOf(tState.q) > -1;
      });
      if (tState.sort) {
        var k = tState.sort, d = tState.desc ? -1 : 1;
        var val = function(r) { return k === 'contacts' ? r.contacts.length : k === 'parent' ? +r.parent.slice(5) : r[k]; };
        rows = rows.slice().sort(function(a, b) { var x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * d; });
      }
      return rows;
    }
    function renderBody() {
      var rows = view(), pages = Math.max(1, Math.ceil(rows.length / PER));
      tState.page = Math.min(tState.page, pages - 1);
      var slice = rows.slice(tState.page * PER, tState.page * PER + PER);
      if (!slice.length) {
        body.innerHTML = '<tr class="dsb-empty"><td colspan="' + COLS.length + '">No entities match \u201c' + tState.q + '\u201d</td></tr>';
      } else {
        body.innerHTML = slice.map(function(r) {
          return '<tr data-id="' + r.id + '" class="' + (tState.sel[r.id] ? 'is-sel' : '') + '">' +
            '<td><span class="dsb-ent"><span class="dsb-cb"></span><span class="av lg" style="background-image:url(assets/ds/logos/lg' + (r.id % 11 + 1) + '.png)"></span>' + r.name + '</span></td>' +
            '<td><span class="dsb-badge ' + r.type + '">' + r.type + '</span></td>' +
            '<td class="dim">' + r.parent + '</td>' +
            '<td>' + (r.contacts.length ? '<span class="dsb-cts">' + r.contacts.slice(0, 2).map(function(n) { return '<span>' + n + '</span>'; }).join('') + (r.contacts.length > 2 ? '<button type="button" class="more" data-more="' + r.id + '" aria-haspopup="dialog" aria-expanded="false" aria-label="Show ' + (r.contacts.length - 2) + ' more contact' + (r.contacts.length === 3 ? '' : 's') + '">+' + (r.contacts.length - 2) + '</button>' : '') + '</span>' : '<span class="dim">\u2013</span>') + '</td>' +
            '<td><span class="dsb-pr"><span class="bar"><span style="width:' + (r.done / 244 * 100) + '%"></span></span><span class="t"><b>' + r.done + '</b>/244</span></span></td>' +
            ['em', 'rev'].map(function(k) {
              var c = COLS.filter(function(x) { return x.k === k; })[0];
              return '<td class="num edit' + (tState.edits[r.id + k] ? ' is-edited' : '') + '" data-k="' + k + '" title="Double-click to edit">' + fmt(r[k], k) + '<span class="u">' + c.unit + '</span></td>';
            }).join('') + '</tr>';
        }).join('');
      }
      q('[data-t-info]').textContent = 'Page ' + (tState.page + 1) + ' of ' + pages;
      q('[data-t-count]').textContent = rows.length + (rows.length === 1 ? ' entity' : ' entities');
      var pg = q('[data-t-pages]'), h = '<button type="button" data-p="prev" aria-label="Previous page"' + (tState.page === 0 ? ' disabled' : '') + '><svg><use href="#dsi-chevron-left"/></svg></button>';
      for (var i = 0; i < pages; i++) h += '<button type="button" data-p="' + i + '"' + (i === tState.page ? ' class="is-on"' : '') + '>' + (i + 1) + '</button>';
      h += '<button type="button" data-p="next" aria-label="Next page"' + (tState.page >= pages - 1 ? ' disabled' : '') + '><svg><use href="#dsi-chevron-right"/></svg></button>';
      pg.innerHTML = h;
      qa('button', pg).forEach(function(b) {
        b.addEventListener('click', function() {
          var p = b.dataset.p;
          tState.page = p === 'prev' ? tState.page - 1 : p === 'next' ? tState.page + 1 : +p;
          renderBody();
        });
      });
      qa('tr[data-id]', body).forEach(function(tr) {
        tr.addEventListener('click', function(e) {
          if (e.target.closest('input, [data-more]')) return;
          var id = +tr.dataset.id;
          if (tState.sel[id]) delete tState.sel[id]; else tState.sel[id] = true;
          tr.classList.toggle('is-sel', !!tState.sel[id]);
          syncAll();
        });
      });
      qa('td.edit', body).forEach(function(td) {
        td.addEventListener('dblclick', function() { editCell(td); });
      });
      ctpClose();
      qa('[data-more]', body).forEach(bindMore);
      syncAll();
    }
    // "+N" contacts: hover or focus peeks, click pins it open
    var ctp = document.createElement('div'), ctpBtn = null, ctpPinned = false, ctpT;
    ctp.className = 'dsb-ctp'; ctp.setAttribute('role', 'dialog');
    canvas.appendChild(ctp);
    function ctpOpen(b, pin) {
      clearTimeout(ctpT);
      if (ctpBtn && ctpBtn !== b) ctpClose();
      var rest = b._more || ROWS[+b.dataset.more].contacts.slice(2);
      var lbl = b._noun ? rest.length + ' more ' + b._noun : rest.length + (rest.length === 1 ? ' more contact' : ' more contacts');
      ctp.innerHTML = '<div class="dsb-ctp-h">' + lbl + '</div><div class="dsb-ctp-l">' + rest.map(function(n) {
        return '<div><i>' + n.split(' ').map(function(w) { return w[0]; }).join('') + '</i>' + n + '</div>';
      }).join('') + '</div>';
      ctp.setAttribute('aria-label', lbl);
      var r = b.getBoundingClientRect(), c = canvas.getBoundingClientRect(), s = c.width / W;
      ctp.style.transform = '';
      ctp.style.left = ((r.left - c.left) / s) + 'px';
      ctp.style.top = ((r.bottom - c.top) / s + 6) + 'px';
      ctpBtn = b; ctpPinned = ctpPinned || !!pin;
      b.classList.add('is-open'); b.setAttribute('aria-expanded', 'true');
      ctp.classList.add('is-on');
    }
    function ctpClose() {
      clearTimeout(ctpT);
      ctp.classList.remove('is-on');
      if (ctpBtn) { ctpBtn.classList.remove('is-open'); ctpBtn.setAttribute('aria-expanded', 'false'); }
      ctpBtn = null; ctpPinned = false;
    }
    function ctpLeave() { if (!ctpPinned) { clearTimeout(ctpT); ctpT = setTimeout(ctpClose, 150); } }
    function bindMore(b) {
      b.addEventListener('pointerenter', function() { clearTimeout(ctpT); ctpT = setTimeout(function() { ctpOpen(b); }, 150); });
      b.addEventListener('pointerleave', ctpLeave);
      b.addEventListener('focus', function() { ctpOpen(b); });
      b.addEventListener('blur', function() { if (!ctpPinned) ctpClose(); });
      b.addEventListener('click', function(e) {
        e.stopPropagation();
        if (ctpBtn === b && ctpPinned) ctpClose(); else { ctpPinned = false; ctpOpen(b, true); }
      });
    }
    ctp.addEventListener('pointerenter', function() { clearTimeout(ctpT); });
    ctp.addEventListener('pointerleave', ctpLeave);
    box.addEventListener('click', function(e) { if (ctpBtn && !e.target.closest('.dsb-ctp, [data-more]')) ctpClose(); });
    box.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && ctpBtn) { e.stopPropagation(); var b = ctpBtn; ctpClose(); b.focus(); }
    });
    q('[data-t-scroll]').addEventListener('scroll', function() { if (ctpBtn) ctpClose(); }, { passive: true });
    function editCell(td) {
      if (q('input', td)) return;
      var id = +td.parentNode.dataset.id, k = td.dataset.k, r = ROWS[id];
      var inp = document.createElement('input');
      inp.type = 'text'; inp.inputMode = 'decimal';
      inp.value = r[k];
      td.innerHTML = '';
      td.appendChild(inp);
      inp.focus({ preventScroll: true }); inp.select();
      var done = false;
      function commit(keep) {
        if (done) return; done = true;
        var n = parseFloat(String(inp.value).replace(/,/g, ''));
        if (keep && !isNaN(n) && n >= 0) {
          r[k] = n;
          if (n !== saved[id][k]) tState.edits[id + k] = true; else delete tState.edits[id + k];
        }
        table.classList.toggle('is-dirty', Object.keys(tState.edits).length > 0);
        renderBody();
      }
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') commit(true);
        if (e.key === 'Escape') { e.stopPropagation(); commit(false); }
      });
      inp.addEventListener('blur', function() { commit(true); });
    }
    q('[data-t-cancel]').addEventListener('click', function() {
      ROWS.forEach(function(r, i) { r.em = saved[i].em; r.rev = saved[i].rev; });
      tState.edits = {};
      table.classList.remove('is-dirty');
      renderBody();
    });
    q('[data-t-save]').addEventListener('click', function() {
      table.classList.add('is-saving');
      setTimeout(function() {
        ROWS.forEach(function(r, i) { saved[i].em = r.em; saved[i].rev = r.rev; });
        tState.edits = {};
        table.classList.remove('is-saving', 'is-dirty');
        renderBody();
        toast('Table saved');
      }, 700);
    });
    qa('[data-tab]').forEach(function(b, i, all) {
      b.addEventListener('click', function() {
        all.forEach(function(x) { x.classList.toggle('is-on', x === b); });
        tState.tab = b.dataset.tab; tState.page = 0;
        renderBody();
      });
    });
    q('[data-t-search]').addEventListener('input', function(e) {
      tState.q = e.target.value.trim().toLowerCase(); tState.page = 0;
      renderBody();
    });
    q('[data-t-add]').addEventListener('click', function() { toast('Add entity \u2014 opens the create flow'); });
    var KBD_MSG = { f: 'Filter \u2014 opens the filter panel', e: 'Export \u2014 downloads a CSV', x: 'Expand \u2014 opens the table full screen' };
    qa('.dsb-ctrl [data-kbd]', table).forEach(function(b) {
      if (KBD_MSG[b.dataset.kbd]) b.addEventListener('click', function() { toast(KBD_MSG[b.dataset.kbd]); });
    });
    // single-key shortcuts while the pointer or focus is in the Table tile
    var tableTile = table.closest('[data-tile]');
    function onTableKey(e) {
      if (!table.isConnected) { window.removeEventListener('keydown', onTableKey); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || q('[data-pp].is-open')) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '')) return;
      if (!tableTile.matches(':hover') && !tableTile.contains(document.activeElement)) return;
      var b = q('.dsb-ctrl [data-kbd="' + e.key.toLowerCase() + '"]', table);
      if (!b || b.offsetParent === null) return;
      e.preventDefault();
      b.classList.add('is-kbd');
      setTimeout(function() { b.classList.remove('is-kbd'); }, 900);
      b.click();
    }
    window.addEventListener('keydown', onTableKey);
    props.table = function(p, v) {
      if (['size', 'tsize', 'align'].indexOf(p) > -1) {
        table.setAttribute('data-' + p, v);
        flash(p === 'tsize' || p === 'align' ? qa('th', head) : qa('tr', body).slice(0, 2));
      } else {
        table.classList.toggle('no-' + p, !v);
        if (v) flash(p === 'search' ? [q('.dsb-search', table)] : p === 'icons' ? qa('th', head) : qa('.dsb-ctrl > [data-prop-el]', table));
      }
    };

    // ── Bulk: its own selection count, independent of the table ──
    var bulk = q('[data-bulk]'), bulkN = q('[data-bulk-n]');
    q('[data-bulk-total]').textContent = ROWS.length;
    var SEL0 = 4, TOTAL = ROWS.length, bulkSel = SEL0;
    function selCount() { return bulkSel; }
    function syncBulk() {
      var n = selCount();
      if (String(n) !== bulkN.textContent) {
        bulkN.textContent = n;
        bulkN.classList.remove('bump'); void bulkN.offsetWidth; bulkN.classList.add('bump');
      }
      bulk.classList.toggle('is-none', n === 0);
      q('[data-bulk-all-l]').textContent = n === TOTAL ? 'Deselect all' : 'Select all';
      qa('[data-bk]', bulk).forEach(function(b) { b.disabled = n === 0; });
    }
    function setSel(all) { bulkSel = all ? TOTAL : 0; syncBulk(); }
    q('[data-bulk-all]').addEventListener('click', function() { setSel(selCount() < TOTAL); });
    q('[data-bulk-x]').addEventListener('click', function() { dismiss(); });
    // An action plays out: the bar drops away, a same-size "Changes Saved"
    // takes its place with a 3s progress bar, then the component resets.
    var stage = q('[data-bulk-stage]'), okMsg = q('[data-ok-msg]'), dd = q('[data-bk-dd]'), ddBtn = q('[data-bk="s1"]'), okT;
    function ents(n) { return n + (n === 1 ? ' entity' : ' entities'); }
    function setMenu(open) {
      dd.classList.toggle('is-open', open);
      ddBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function resetBulk() {
      clearTimeout(okT);
      if (!stage.classList.contains('is-done')) return;
      stage.classList.remove('is-done');
      bulkSel = SEL0; syncBulk();
    }
    // close: the bar drops away like after an action, then comes back 2s later
    function dismiss() {
      setMenu(false);
      stage.classList.add('is-gone');
      clearTimeout(okT);
      okT = setTimeout(function() {
        bulkSel = SEL0; syncBulk();
        stage.classList.remove('is-gone');
      }, 2350);
    }
    function done(msg) {
      setMenu(false);
      okMsg.textContent = msg;
      stage.classList.add('is-done');
      clearTimeout(okT);
      okT = setTimeout(resetBulk, 3300);
    }
    var BK = { s2: 'Due date set for ', p2: 'Omitted ', p1: 'Submitted ' };
    qa('[data-bk]', bulk).forEach(function(b) {
      b.addEventListener('click', function(e) {
        if (b === ddBtn) { e.stopPropagation(); setMenu(!dd.classList.contains('is-open')); return; }
        done(BK[b.dataset.bk] + ents(selCount()) + '.');
      });
    });
    qa('[data-role]', dd).forEach(function(r) {
      r.addEventListener('click', function() { done(ents(selCount()) + ' assigned to ' + r.dataset.role + '.'); });
    });
    q('[data-ok-btn]').addEventListener('click', resetBulk);
    box.addEventListener('click', function(e) { if (!e.target.closest('[data-bk-dd]')) setMenu(false); });
    // Esc: closes the menu, else does what the close button does (its tooltip says so)
    var bulkTile = stage.closest('[data-tile]');
    function onEsc(e) {
      if (!box.isConnected) { window.removeEventListener('keydown', onEsc, true); return; }
      if (e.key !== 'Escape' || q('[data-pp].is-open')) return;
      if (!bulkTile.matches(':hover') && !bulkTile.contains(document.activeElement)) return;
      if (dd.classList.contains('is-open')) setMenu(false);
      else if (!stage.classList.contains('is-done') && !stage.classList.contains('is-gone')) dismiss();
      else return;
      e.stopPropagation(); e.preventDefault();
    }
    window.addEventListener('keydown', onEsc, true);
    props.bulk = function(p, v) {
      if (p === 'label') { q('[data-bulk-label]').textContent = v; return; }
      var b = p === 'x' ? q('[data-bulk-x]') : p === 's1' ? dd : q('[data-bk="' + p + '"]', bulk);
      b.hidden = !v;
      if (v) flash([b]);
      else if (p === 's1') setMenu(false);
    };


    // ── autoplay: until the pointer enters a tile, a ghost cursor walks the
    // visible tiles and uses them. It calls the state functions directly, so
    // no toasts and never the clipboard. The tile under the pointer is skipped
    // (and reset if it was playing); a tile the visitor has clicked drops out.
    (function() {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var ghost = document.createElement('span');
      ghost.className = 'dsb-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.innerHTML = '<svg viewBox="0 0 20 20"><path d="M4 2.5v13.2l3.4-3.1 2.3 5.1 2.3-1-2.3-5h4.7z"/></svg>';
      canvas.appendChild(ghost);

      var navOn = q('[data-nav].is-active'), netBtn = q('[data-group-toggle]');
      function setNav(b, open) {
        qa('[data-nav]').forEach(function(x) { x.classList.toggle('is-active', x === b); });
        qa('[data-group]').forEach(function(g) { g.classList.toggle('is-open', open && g.contains(b)); });
      }
      function sortBy(k, desc) { tState.sort = k; tState.desc = !!desc; renderHead(); renderBody(); }
      function tRow(i) { return function() { return qa('tr[data-id]', body)[i]; }; }
      function tPick(i) { var tr = tRow(i)(); if (tr) { tState.sel[+tr.dataset.id] = !tState.sel[+tr.dataset.id]; if (!tState.sel[+tr.dataset.id]) delete tState.sel[+tr.dataset.id]; renderBody(); } }
      function tTab(t) { qa('[data-tab]').forEach(function(x) { x.classList.toggle('is-on', x.dataset.tab === t); }); tState.tab = t; tState.page = 0; renderBody(); }
      function msFlip(o) { if (o) setOpt(o.dataset.opt, o.getAttribute('aria-selected') !== 'true'); }
      function el(sel) { return function() { return q(sel); }; }
      var msInit, icInit, figInit;

      // each step: [target, action, pause after]
      var DEMOS = {
        side: {
          steps: [
            [function() { return coBtn; }, function() { setCo(true); }, 1500],
            [function() { return qa('[data-co-i]', co)[1]; }, null, 500],
            [function() { return coBtn; }, function() { setCo(false); }, 500],
            [function() { return netBtn; }, function() { setNav(netBtn, true); }, 1300],
            [function() { return fold; }, function() { setRail(true); }, 1700],
            [function() { return fold; }, function() { setRail(false); }, 900]
          ],
          reset: function() {
            setCo(false); year.classList.remove('is-open');
            if (side.classList.contains('is-rail')) setRail(false);
            setNav(navOn, false);
          }
        },
        table: {
          steps: [
            [el('[data-table] th[data-k="type"]'), function() { sortBy('type'); }, 1100],
            [el('[data-table] th[data-k="type"]'), function() { sortBy('type', true); }, 1200],
            [tRow(0), function() { tPick(0); }, 500],
            [tRow(2), function() { tPick(2); }, 500],
            [el('[data-t-all]'), function() { var rows = view(); rows.forEach(function(r) { tState.sel[r.id] = true; }); renderBody(); }, 1200],
            [el('[data-tab="Fund"]'), function() { tTab('Fund'); }, 1300],
            [el('[data-tab="all"]'), function() { tTab('all'); }, 700]
          ],
          reset: function() {
            tState.sort = null; tState.desc = false; tState.sel = {};
            tTab('all'); renderHead(); renderBody();
          }
        },
        bulk: {
          steps: [
            [el('[data-bulk-all]'), function() { setSel(true); }, 1200],
            [function() { return ddBtn; }, function() { setMenu(true); }, 1000],
            [el('[data-role="Collector"]'), function() { done(ents(selCount()) + ' assigned to Collector.'); }, 5800]
          ],
          reset: function() { setMenu(false); clearTimeout(okT); stage.classList.remove('is-done', 'is-gone'); bulkSel = SEL0; syncBulk(); }
        },
        select: {
          start: function() { msInit = opts.map(function(o) { return o.getAttribute('aria-selected'); }); },
          steps: [
            [function() { return opts[2]; }, function() { msFlip(opts[2]); }, 700],
            [function() { return opts[3]; }, function() { msFlip(opts[3]); }, 700],
            [function() { return opts[0]; }, function() { msFlip(opts[0]); }, 1100],
            [el('[data-ms-field]'), function() { ms.classList.remove('is-open'); }, 1200],
            [el('[data-ms-field]'), function() { ms.classList.add('is-open'); }, 600]
          ],
          reset: function() {
            if (msInit) opts.forEach(function(o, i) { o.setAttribute('aria-selected', msInit[i]); });
            ms.classList.add('is-open'); renderChips();
          }
        },
        icons: {
          start: function() { icInit = qa('[data-icon]').map(function(b) { return b.dataset.style; }); },
          steps: [0, 3, 5].map(function(i) {
            return [function() { return qa('[data-icon]')[i]; }, function() { var b = qa('[data-icon]')[i]; if (b) setIconStyle(b, b.dataset.style === 'Style=Filled' ? 'Outlined' : 'Filled'); }, 700];
          }),
          reset: function() {
            if (icInit) qa('[data-icon]').forEach(function(b, i) { if (b.dataset.style !== icInit[i]) setIconStyle(b, icInit[i].slice(6)); });
          }
        },
        figma: {
          start: function() { figInit = { page: qa('[data-pages] button').filter(function(b) { return b.classList.contains('is-on'); })[0], col: curCol }; },
          steps: [
            [function() { return qa('[data-pages] button')[1]; }, function() { var b = qa('[data-pages] button'); b.forEach(function(x, i) { x.classList.toggle('is-on', i === 1); }); }, 900],
            [el('[data-col="radius"]'), function() { setCol('radius'); }, 1300],
            [el('[data-col="product"]'), function() { setCol('product'); }, 1300],
            [el('[data-vgrp="Product/Sentiment"]'), function() { setGroup('Product/Sentiment'); }, 1500]
          ],
          reset: function() {
            if (!figInit) return;
            qa('[data-pages] button').forEach(function(x) { x.classList.toggle('is-on', x === figInit.page); });
            curGroup = {};
            setCol(figInit.col);
          }
        }
      };
      function setCol(c) {
        qa('[data-col]').forEach(function(x) { x.classList.toggle('is-on', x.dataset.col === c); });
        curCol = c; renderVars();
      }

      // every visible tile plays its own loop with its own cursor; the one the
      // pointer enters stops and resets, the rest carry on
      var ORDER = ['table', 'side', 'bulk', 'select', 'icons', 'figma'];
      var run = {};
      ORDER.forEach(function(k) {
        var tile = q('[data-tile="' + k + '"]');
        if (!tile || !DEMOS[k]) return;
        var g = document.createElement('span');
        g.className = 'dsb-ghost';
        g.setAttribute('aria-hidden', 'true');
        g.innerHTML = ghost.innerHTML;
        canvas.appendChild(g);
        run[k] = { tile: tile, g: g, timers: [], vis: false, over: false, used: false, playing: false };
      });
      ghost.remove();
      function later(R, fn, ms) { R.timers.push(setTimeout(fn, ms)); }
      function alive() {
        if (box.isConnected) return true;
        ORDER.forEach(function(k) { if (run[k]) { run[k].timers.forEach(clearTimeout); run[k].timers = []; } });
        return false;
      }
      function aim(R, target) {
        var r = target.getBoundingClientRect(), c = canvas.getBoundingClientRect(), s = c.width / W;
        var x = (r.left + Math.min(r.width / 2, 60) - c.left) / s, y = (r.top + r.height / 2 - c.top) / s;
        R.g.style.transform = 'translate(' + (x - 6) + 'px,' + (y - 4) + 'px)';
      }
      function press(R) {
        R.g.classList.remove('is-press'); void R.g.offsetWidth; R.g.classList.add('is-press');
        later(R, function() { R.g.classList.remove('is-press'); }, 220);
      }
      function canPlay(R) { return R.vis && !R.over && !R.used; }
      function stopTile(k) {
        var R = run[k]; if (!R) return;
        R.timers.forEach(clearTimeout); R.timers = [];
        R.g.classList.remove('is-on');
        if (R.playing) { R.playing = false; try { DEMOS[k].reset(); } catch (err) {} }
      }
      function startTile(k, delay) {
        var R = run[k];
        if (!R || R.playing || !canPlay(R)) return;
        R.timers.forEach(clearTimeout); R.timers = [];
        later(R, function() {
          if (!alive() || !canPlay(R)) return;
          R.playing = true;
          loop(k);
        }, delay || 0);
      }
      function loop(k) {
        var R = run[k], d = DEMOS[k];
        if (d.start) d.start();
        var first = d.steps[0][0]();
        if (first) { R.g.style.transition = 'none'; aim(R, first); void R.g.offsetWidth; R.g.style.transition = ''; }
        R.g.classList.add('is-on');
        step(k, 0);
      }
      function step(k, i) {
        var R = run[k], d = DEMOS[k];
        if (!alive() || !R.playing) return;
        if (i >= d.steps.length) {
          later(R, function() {
            try { d.reset(); } catch (err) {}
            later(R, function() { if (R.playing) loop(k); }, 900);
          }, 300);
          return;
        }
        var s = d.steps[i], t = s[0] && s[0]();
        if (!t) { step(k, i + 1); return; }
        aim(R, t);
        later(R, function() {
          if (s[1]) { press(R); try { s[1](); } catch (err) {} }
          later(R, function() { step(k, i + 1); }, Math.round((s[2] || 800) * 0.6));
        }, 480);
      }
      ORDER.concat(['card', 'found']).forEach(function(k) {
        var t = q('[data-tile="' + k + '"]'), R = run[k];
        if (!t || !R) return;
        t.addEventListener('pointerenter', function() { R.over = true; stopTile(k); });
        t.addEventListener('pointerleave', function() { R.over = false; startTile(k, 1200); });
        // the spacing-guides toggle only overlays the tile, it doesn't use it,
        // so the demo picks up again once the pointer leaves
        t.addEventListener('pointerdown', function(e) { if (e.target.closest('.dsb-guide')) return; R.used = true; stopTile(k); });
        t.addEventListener('focusin', function(e) { if (e.target !== t && !e.target.closest('.dsb-guide')) { R.used = true; stopTile(k); } });
      });
      if (window.IntersectionObserver) {
        var vio = new IntersectionObserver(function(es) {
          es.forEach(function(en) {
            var k = en.target.getAttribute('data-tile'), R = run[k];
            if (!R) return;
            R.vis = en.isIntersecting;
            if (R.vis) startTile(k, 600 + ORDER.indexOf(k) * 250); else stopTile(k);
          });
        }, { threshold: 0.4 });
        ORDER.forEach(function(k) { if (run[k]) vio.observe(run[k].tile); });
      } else ORDER.forEach(function(k) { if (run[k]) { run[k].vis = true; startTile(k, 1000); } });
    })();

    renderHead(); renderBody(); syncBulk();
  });
}

document.addEventListener('DOMContentLoaded', function() { initDsBento(document.body); });
