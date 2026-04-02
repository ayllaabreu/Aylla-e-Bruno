(function(){
'use strict';

/* ── CURSOR (pointer devices only) ── */
var cur  = document.getElementById('cur');
var ring = document.getElementById('ring');
var mx = -200, my = -200;
var lx = -200, ly = -200;

document.addEventListener('mousemove', function(e){
  mx = e.clientX; my = e.clientY;
  cur.style.transform = 'translate(' + (mx - 6) + 'px,' + (my - 6) + 'px)';
});

/* ring segue o cursor com lerp suave */
(function lerpRing(){
  lx += (mx - lx) * 0.11;
  ly += (my - ly) * 0.11;
  ring.style.transform = 'translate(' + (lx - 12) + 'px,' + (ly - 12) + 'px)';
  requestAnimationFrame(lerpRing);
})();

document.addEventListener('mouseover', function(e){
  var el = e.target ? e.target.closest('button:not(.done),[role=button],.tab,.chdr,.bi,.secbtn,.runbtn') : null;
  if(el){
    cur.style.background = '#FF79C6';
    cur.style.boxShadow  = '0 0 0 2px rgba(255,121,198,.3),0 0 14px #FF79C6';
    ring.style.borderColor = 'rgba(255,121,198,.6)';
  } else {
    cur.style.background = '#BD93F9';
    cur.style.boxShadow  = '0 0 0 2px rgba(189,147,249,.25),0 0 14px #BD93F9,0 0 28px rgba(189,147,249,.35)';
    ring.style.borderColor = 'rgba(189,147,249,.5)';
  }
});

/* ── SCROLL BAR ── */
var scrollTicking = false;
window.addEventListener('scroll', function(){
  if(!scrollTicking){
    requestAnimationFrame(function(){
      var sy = window.scrollY;
      var pct = sy / (document.body.scrollHeight - window.innerHeight) * 100;
      document.getElementById('sbar').style.width = pct + '%';
      updateTabs();
      /* parallax sutil nos orbs */
      document.querySelectorAll('.orb').forEach(function(orb, i){
        if(orb.style.transform && orb.style.transform.indexOf('translate(-50%') !== -1) return;
        var speed = 0.018 + (i * 0.006);
        var dir   = i % 2 === 0 ? 1 : -1;
        orb.style.transform = 'translateY(' + (sy * speed * dir) + 'px)';
      });
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, {passive:true});

/* ── COUNTERS with roll-up animation ── */
var MET    = new Date('2024-11-21');
var TICKET = new Date('2025-04-04');
function days(d){ return Math.floor((Date.now() - d.getTime()) / 86400000); }

var countersAnimated = {};
function animateCounter(el, target, color){
  if(!el || countersAnimated[el.id]) return;
  countersAnimated[el.id] = true;
  var start = 0;
  var duration = 1400;
  var startTime = null;
  function ease(t){ return t < .5 ? 2*t*t : -1+(4-2*t)*t; }
  function step(ts){
    if(!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    var current = Math.floor(ease(progress) * target);
    el.textContent = current;
    if(progress < 1){
      requestAnimationFrame(step);
    } else {
      el.textContent = target;
      el.classList.add('animating');
      setTimeout(function(){ el.classList.remove('animating'); }, 300);
    }
  }
  requestAnimationFrame(step);
}

/* heroC reference removed — element does not exist in DOM */

/* Trigger counter animation when #conflict section enters view */
var conflictObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      animateCounter(document.getElementById('cA'), days(MET));
      animateCounter(document.getElementById('cB'), days(TICKET));
      animateCounter(document.getElementById('cM'), days(TICKET));
    }
  });
}, {threshold:0.2});
var conflictEl = document.getElementById('conflict');
if(conflictEl) conflictObserver.observe(conflictEl);

/* ── HERO STAT CARDS — entrada escalonada + count-up ── */
var heroStatsTriggered = false;
/* pré-esconde os cards para animação */
document.querySelectorAll('.hstat').forEach(function(s){ s.classList.add('stat-hidden'); });
var heroStatObs = new IntersectionObserver(function(entries){
  if(entries[0].isIntersecting && !heroStatsTriggered){
    heroStatsTriggered = true;
    document.querySelectorAll('.hstat').forEach(function(s){ s.classList.add('stat-in'); });
    var v1 = document.getElementById('hstatV1');
    var v3 = document.getElementById('hstatV3');
    if(v1){
      var n1 = 0;
      var t1 = setInterval(function(){
        if(n1 < 5){ n1++; v1.textContent = (n1 < 10 ? '0' : '') + n1; }
        else{ clearInterval(t1); v1.textContent = '05'; }
      }, 400); /* 400ms por dígito — 5 steps = 2s total */
    }
    if(v3){
      setTimeout(function(){
        var target = days(TICKET);
        var steps = 40; /* mais passos = movimento mais fluido */
        var step3 = Math.max(1, Math.floor(target / steps));
        var t3 = setInterval(function(){
          n3 = Math.min(n3 + step3, target);
          v3.textContent = n3;
          if(n3 >= target){ clearInterval(t3); v3.textContent = target; }
        }, 55); /* 40 steps × 55ms ≈ 2.2s total */
        var n3 = 0;
      }, 440); /* começa junto com o terceiro card */
    }
    heroStatObs.disconnect();
  }
}, {threshold:0.4});
var indexSec = document.getElementById('index');
if(indexSec) heroStatObs.observe(indexSec);

/* ── PROGRESSIVE REVEAL observer ── */
var fadeObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target); /* revela só uma vez */
    }
  });
}, {threshold:0.22, rootMargin:'0px 0px -80px 0px'});
document.querySelectorAll('.sec-fade').forEach(function(s){ fadeObserver.observe(s); });

/* ── TYPEWRITER SPLASH ── */
var lines = [
  'accessing_encrypted_love_story...',
  'decrypting love_data.bin...',
  'loading timeline.git...',
  'status: 365_days — stable ✓'
];
var li=0, ci=0, phase='type';
var ttext = document.getElementById('ttext');
var scur  = document.getElementById('scur');

function typeNext(){
  if(li >= lines.length){ if(scur) scur.style.display='none'; return; }
  var line = lines[li];
  if(phase === 'type'){
    if(ci < line.length){
      ttext.textContent += line[ci++];
      setTimeout(typeNext, 46);
    } else {
      phase = 'pause';
      setTimeout(typeNext, 700);
    }
  } else if(phase === 'pause'){
    phase = 'erase';
    setTimeout(typeNext, 200);
  } else {
    if(ci > 0){
      ttext.textContent = ttext.textContent.slice(0, -1);
      ci--;
      setTimeout(typeNext, 18);
    } else {
      li++; phase = 'type';
      if(li < lines.length){
        setTimeout(typeNext, 320);
      } else {
        ttext.textContent = 'session_ready ✓';
        if(scur) scur.style.display = 'none';
        document.querySelector('.sp-btn').classList.add('ready');
      }
    }
  }
}
setTimeout(typeNext, 900);

/* ── TERMINAL intro typewriter ── */
(function initTerminal(){
  var lsTyped  = document.getElementById('lsTyped');
  var lsCur    = document.getElementById('lsCur');
  var lsOut    = document.getElementById('lsOut');
  var promptLn = document.getElementById('promptLine');
  var lsText   = 'ls memories/';
  var i = 0;
  function typeLs(){
    if(i < lsText.length){
      lsTyped.textContent += lsText[i++];
      setTimeout(typeLs, 70);
    } else {
      lsCur.style.display = 'none';
      setTimeout(function(){
        lsOut.style.display = 'block';
        setTimeout(function(){ promptLn.style.display = 'flex'; }, 400);
      }, 300);
    }
  }
  /* Start typing when section enters view */
  var termObs = new IntersectionObserver(function(entries){
    if(entries[0].isIntersecting){ termObs.disconnect(); setTimeout(typeLs, 600); }
  }, {threshold:0.3});
  var foreverSec = document.getElementById('forever');
  if(foreverSec) termObs.observe(foreverSec);
})();

/* ── LAUNCH ── */
window.launch = function(){
  var sp = document.getElementById('splash');
  sp.classList.add('hide');
  setTimeout(function(){
    sp.style.display = 'none';
    document.getElementById('main').style.display = 'block';
    document.body.style.overflowY = 'auto';
    window.scrollTo(0,0);
    /* header pousa suavemente depois do main aparecer */
    setTimeout(function(){
      document.getElementById('hdr').classList.add('hdr-visible');
    }, 120);
    /* re-observa o hero após main ficar visível */
    if(!heroStatsTriggered && indexSec){
      heroStatObs.observe(indexSec);
    }
  }, 900);
};

/* ── TABS ── */
window.go = function(id){
  var el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
};
function updateTabs(){
  var ids = ['index','conflict','timeline','ticket','memories','forever','secret'];
  var active = 'index';
  ids.forEach(function(s){
    var el = document.getElementById(s);
    if(el && el.getBoundingClientRect().top <= 80) active = s;
  });
  /* Map section → tab index */
  var map = {index:0,conflict:1,timeline:2,ticket:3,memories:4,forever:5,secret:6};
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function(t){ t.classList.remove('on'); });
  if(map[active] !== undefined) tabs[map[active]].classList.add('on');
}

/* ── CONFLICT ── */
var resolved = false;
window.resolveConflict = function(){
  if(resolved) return;
  resolved = true;

  var btn = document.getElementById('resolveBtn');
  btn.textContent = '✓ Merging...';
  btn.classList.add('done');

  /* mostra terminal inline com animação de entrada */
  var term = document.getElementById('inlineTerm');
  term.classList.add('show');
  /* força reflow para a transição funcionar */
  term.getBoundingClientRect();
  term.classList.add('visible');

  /* roda o terminal e ao final atualiza o botão */
  runGitTerminal(function(){
    btn.textContent = '✓ Conflict Resolved — forever.exe ♥';
    setTimeout(function(){
      term.scrollIntoView({behavior:'smooth', block:'center'});
    }, 300);
  });
};

function runGitTerminal(onDone){
  var body = document.getElementById('gtBody');

  function appendLine(cls, text, delay, cb){
    setTimeout(function(){
      var d = document.createElement('div');
      d.className = cls;
      d.textContent = '';
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
      var i = 0;
      var spd = cls.indexOf('graph') !== -1 ? 18 : 22;
      var ti = setInterval(function(){
        if(i < text.length){ d.textContent = text.slice(0, ++i); body.scrollTop = body.scrollHeight; }
        else{ clearInterval(ti); if(cb) cb(); }
      }, spd);
    }, delay);
  }

  function appendPrompt(cmdText, delay, cb){
    setTimeout(function(){
      var row = document.createElement('div');
      row.className = 'gt-prompt';
      row.style.marginTop = '8px';
      row.innerHTML = '<span class="gt-ps">aylla@bruno</span><span class="gt-dollar">:~$&nbsp;</span><span class="gt-cmd"></span>';
      body.appendChild(row);
      var cs = row.querySelector('.gt-cmd');
      var i = 0;
      var ti = setInterval(function(){
        if(i < cmdText.length){ cs.textContent = cmdText.slice(0,++i); body.scrollTop = body.scrollHeight; }
        else{ clearInterval(ti); if(cb) cb(); }
      }, 55);
    }, delay);
  }

  /* primeiro prompt aparece direto e digita o comando */
  appendPrompt('git log --oneline --graph', 200, function(){
    appendLine('gt-out-graph', '* 21-11-2024 — deploy emocional não documentado (Aylla)', 600);
    appendLine('gt-out-graph', '* 04-04-2025 — merge request aprovado (Bruno)',            1100);

    appendPrompt('git diff --stat', 1900, function(){
      appendLine('gt-out-yellow', '  amor.json         |  +∞  linhas adicionadas',  2600);
      appendLine('gt-out-pink',   '  solidao.exe       |  -1  removida',             3100);
      appendLine('gt-out-cyan',   '  2 files changed, ∞ additions(+), 1 deletion(-)',3600);

      appendLine('gt-out-muted', '',                                                  4200);
      appendLine('gt-out-muted', '// o amor já estava em produção.',                  4300);
      appendLine('gt-out-muted', '// o Bruno só deu pull depois do chamado.',         4900);
      appendLine('gt-out-muted', '// ambos estão certos — comemoram nos dois dias.',  5500, function(){
        if(onDone) setTimeout(onDone, 600);
      });
    });
  });
}

/* ── TIMELINE COMMITS ── */
/* ── HORIZONTAL TIMELINE — selectCommit ── */
window.selectCommit = function(id){
  /* desativa todos os nodes e conteúdos */
  document.querySelectorAll('.tl-node').forEach(function(n){ n.classList.remove('active'); });
  document.querySelectorAll('.tl-content').forEach(function(c){ c.classList.remove('active'); });

  /* ativa o node clicado */
  var nodeEl = document.getElementById('tln-' + id);
  if(nodeEl) nodeEl.classList.add('active');

  /* ativa o painel de conteúdo e reseta o scroll para o topo */
  var content = document.getElementById(id);
  if(content){
    content.classList.add('active');
    content.scrollTop = 0;
  }
};

/* mantém toggleC como alias por compatibilidade */
window.toggleC = window.selectCommit;

/* ── PR TICKET ── */
var prOpen = false;
window.togglePR = function(){
  prOpen = !prOpen;
  document.getElementById('prEmail').classList.toggle('open', prOpen);
  document.getElementById('prArrow').textContent   = prOpen ? '▼' : '▶';
  document.getElementById('prBtnText').textContent = prOpen ? 'hide_thread.md' : 'view_full_thread.md';
};

/* ── FOREVER.EXE — typewriter outputs ── */
var foreverRun = false;
window.runForever = function(){
  if(foreverRun) return;
  foreverRun = true;
  document.getElementById('runBtn').style.opacity = '0.4';
  var tbody = document.getElementById('termBody');
  var curEl = document.getElementById('termCur');
  if(curEl && curEl.parentElement) curEl.style.display = 'none';

  var seq = [
    {d:200,  type:'cmd', text:'./forever.exe'},
    {d:1000, type:'out', text:'initializing_infinite_loop...', c:'#BD93F9'},
    {d:1700, type:'out', text:'loading: amor.json ..................... ✓', c:'#50FA7B'},
    {d:2300, type:'out', text:'loading: felicidade.bin ................ ✓', c:'#50FA7B'},
    {d:2900, type:'out', text:'compiling: memories/* .................. ✓', c:'#50FA7B'},
    {d:3600, type:'out', text:'status: stable',              c:'#8BE9FD'},
    {d:4100, type:'out', text:'love_level: 100%',            c:'#FF79C6'},
    {d:4700, type:'out', text:'uptime: 365d — no errors found', c:'#50FA7B'},
    {d:5300, type:'out', text:'> loop(∞) { return amor; }',  c:'#F1FA8C'},
    {d:6000, type:'out', text:'running forever... ♥',        c:'#FF79C6'},
  ];

  seq.forEach(function(s){
    setTimeout(function(){
      if(s.type === 'cmd'){
        var row = document.createElement('div');
        row.className = 'tline';
        row.style.marginTop = '8px';
        row.innerHTML = '<span class="tpr">aylla@bruno</span><span style="color:#8B949E">:~$</span><span class="tcmd">&nbsp;</span>';
        tbody.appendChild(row);
        var cmdSpan = row.querySelector('.tcmd');
        var ci2 = 0;
        var t = setInterval(function(){
          if(ci2 < s.text.length){ cmdSpan.textContent = s.text.slice(0, ++ci2); }
          else{ clearInterval(t); tbody.scrollTop = tbody.scrollHeight; }
        }, 55);
      } else {
        /* typewriter for output lines */
        var out = document.createElement('div');
        out.className = 'tout';
        out.style.color = s.c || '#50FA7B';
        out.textContent = '';
        tbody.appendChild(out);
        var ci3 = 0;
        var t2 = setInterval(function(){
          if(ci3 < s.text.length){ out.textContent = s.text.slice(0, ++ci3); }
          else{ clearInterval(t2); }
          tbody.scrollTop = tbody.scrollHeight;
        }, 28);
      }
    }, s.d);
  });
};

/* ── MODAL + HEARTS ── */
var heartAnim = null;
var hparts = [];

window.openModal = function(){
  document.getElementById('modal').classList.add('open');
  startHearts();
};
window.closeModal = function(){
  document.getElementById('modal').classList.remove('open');
  stopHearts();
};
document.addEventListener('keydown', function(e){ if(e.key==='Escape') window.closeModal(); });

/* resize canvas when modal open */
window.addEventListener('resize', function(){
  var canvas = document.getElementById('hc');
  if(document.getElementById('modal').classList.contains('open')){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

function drawHeart(ctx, x, y, s){
  /* heart shape — s is half-size, proporções corrigidas */
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.25);
  ctx.bezierCurveTo(x,        y - s * 0.5,  x - s * 1.1, y - s * 0.5,  x - s * 1.1, y + s * 0.1);
  ctx.bezierCurveTo(x - s * 1.1, y + s * 0.7,  x,           y + s * 1.2,  x,           y + s * 1.2);
  ctx.bezierCurveTo(x,        y + s * 1.2,  x + s * 1.1, y + s * 0.7,  x + s * 1.1, y + s * 0.1);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 0.5,  x,           y - s * 0.5,  x,           y + s * 0.25);
  ctx.closePath();
}

function startHearts(){
  var canvas = document.getElementById('hc');
  var ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  hparts = [];
  for(var i = 0; i < 55; i++){
    hparts.push({
      x:  Math.random() * canvas.width,
      y:  -Math.random() * canvas.height,   /* começa acima da tela */
      sz: Math.random() * 9 + 4,
      sp: Math.random() * 1.1 + 0.4,        /* velocidade de queda */
      op: Math.random() * 0.45 + 0.2,
      wb: Math.random() * Math.PI * 2,
      ws: Math.random() * 0.028 + 0.008,
      c:  Math.random() > .5 ? '#FF79C6' : '#BD93F9'
    });
  }
  function loop(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hparts.forEach(function(p){
      p.y  += p.sp;                          /* cai para baixo */
      p.wb += p.ws;
      p.x  += Math.sin(p.wb) * 0.5;
      if(p.y > canvas.height + 40) p.y = -20; /* reinicia no topo */
      ctx.save();
      ctx.globalAlpha = p.op;
      ctx.fillStyle = p.c;
      drawHeart(ctx, p.x, p.y, p.sz);
      ctx.fill();
      ctx.restore();
    });
    heartAnim = requestAnimationFrame(loop);
  }
  heartAnim = requestAnimationFrame(loop);
}

function stopHearts(){
  if(heartAnim){ cancelAnimationFrame(heartAnim); heartAnim = null; }
  var canvas = document.getElementById('hc');
  if(canvas){ var ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); }
}


/* ══════════════════════════════════════════════
   PREMIUM v3 JS — HIGH IMPACT LAYER
   ══════════════════════════════════════════════ */

/* ── H1. HERO ENTRANCE — revela com fadeUp+blur escalonado ──
   Adiciona .hero-init ao #index imediatamente;
   remove quando o main fica visível (após launch) ── */
(function(){
  var indexEl = document.getElementById('index');
  var mainEl  = document.getElementById('main');
  if (!indexEl || !mainEl) return;

  indexEl.classList.add('hero-init');

  var triggered = false;
  var obs = new MutationObserver(function(){
    if (triggered) return;
    if (mainEl.style.display !== 'none') {
      triggered = true;
      obs.disconnect();
      /* pequeno delay para o browser renderizar antes de remover a classe */
      setTimeout(function(){
        indexEl.classList.remove('hero-init');
      }, 90);
    }
  });
  obs.observe(mainEl, { attributes: true, attributeFilter: ['style'] });
})();

/* ── H2. MOUSE PARALLAX NOS ORBS DO HERO ──
   Orbs do #index acompanham o mouse com lerp suave,
   criando profundidade 3D imediata ── */
(function(){
  var basesSaved = false;
  var hMX = 0, hMY = 0, hTX = 0, hTY = 0;

  /* salva o transform original de cada orb uma única vez */
  function saveBase(){
    if (basesSaved) return;
    document.querySelectorAll('#index .orb').forEach(function(o){
      o.dataset.bt = o.style.transform || '';
    });
    basesSaved = true;
  }

  document.addEventListener('mousemove', function(e){
    /* só processa quando o hero está visível */
    if (window.scrollY > window.innerHeight * .75) return;
    hTX = (e.clientX / window.innerWidth  - 0.5);
    hTY = (e.clientY / window.innerHeight - 0.5);
  });

  (function loop(){
    requestAnimationFrame(loop);
    if (!basesSaved) saveBase();
    /* para o parallax quando o usuário rola para fora do hero */
    if (window.scrollY > window.innerHeight * .75) return;

    /* lerp suave */
    hMX += (hTX - hMX) * .052;
    hMY += (hTY - hMY) * .052;

    document.querySelectorAll('#index .orb').forEach(function(orb, i){
      var base = orb.dataset.bt || '';
      /* fatores diferentes por orb para criar profundidade */
      var px = (hMX * (18 + i * 11) * (i % 2 === 0 ? 1 : -.72)).toFixed(2);
      var py = (hMY * (12 + i *  7)).toFixed(2);

      if (base.indexOf('-50%') !== -1) {
        /* orb centralizado: preserva o translate(-50%,-50%) base */
        orb.style.transform = base + ' translate(' + px + 'px,' + py + 'px)';
      } else {
        orb.style.transform = 'translate(' + px + 'px,' + py + 'px)';
      }
    });
  })();
})();

/* ── H3. TIMELINE GL DRAW — linha cresce ao entrar na viewport ── */
(function(){
  var tlEl = document.getElementById('timeline');
  if (!tlEl) return;
  var obs = new IntersectionObserver(function(entries){
    if (entries[0].isIntersecting){
      tlEl.classList.add('tl-visible');
      obs.disconnect();
    }
  }, { threshold: 0.07 });
  obs.observe(tlEl);
})();

/* ── H4. MODAL — fecha com transição real (sem piscar) ──
   O CSS já lida com a transição via opacity;
   aqui apenas garantimos que o closeModal espera o fade-out
   antes de parar os hearts (melhora a suavidade do close) ── */
(function(){
  var origClose = window.closeModal;
  window.closeModal = function(){
    var m = document.getElementById('modal');
    if (m) m.classList.remove('open');
    /* espera a transição de opacity (.42s) para parar os hearts */
    setTimeout(function(){ stopHearts(); }, 460);
  };
})();

/* ── A8. PR METRICS — ativa barra diff ao entrar na viewport ── */
(function(){
  var metrics = document.querySelector('.pr-metrics');
  if (!metrics) return;
  var obs = new IntersectionObserver(function(entries){
    if (entries[0].isIntersecting){
      metrics.classList.add('pr-anim');
      obs.disconnect();
    }
  }, { threshold: 0.45 });
  obs.observe(metrics);
})();

})();
