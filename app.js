(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  function closeMenu() {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if(open) navigation.querySelector('a').focus();
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.querySelector('.header-contact').addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape' && navigation.classList.contains('is-open')) { closeMenu(); menuButton.focus(); }
  });
  const demoDialog = document.querySelector('#demo-dialog');
  document.querySelector('[data-demo]').addEventListener('click', () => demoDialog.showModal());
  demoDialog.querySelector('.dialog-close').addEventListener('click', () => demoDialog.close());
  demoDialog.addEventListener('click', event => {
    if(event.target !== demoDialog) return;
    const box = demoDialog.getBoundingClientRect();
    if(event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) demoDialog.close();
  });

  const appointmentForm = document.querySelector('#appointment-form');
  const clientName = document.querySelector('#client-name');
  const clientPhone = document.querySelector('#client-phone');
  const clientIssue = document.querySelector('#client-issue');
  const formSuccess = document.querySelector('#form-success');
  function refreshScroll() { if(window.ScrollTrigger) ScrollTrigger.refresh(); }
  function validateName() {
    clientName.setCustomValidity(clientName.value.trim().length < 2 ? 'Введите имя: не менее двух символов.' : '');
  }
  function validatePhone() {
    const phone = clientPhone.value.trim();
    const digits = phone.replace(/\D/g, '');
    const valid = /^\+?[\d\s()\-]+$/.test(phone) && digits.length >= 10 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
    clientPhone.setCustomValidity(valid ? '' : 'Введите телефон: от 10 до 15 цифр. Можно использовать +, пробелы, дефисы и скобки.');
  }
  clientName.addEventListener('input', validateName);
  clientPhone.addEventListener('input', validatePhone);
  clientIssue.addEventListener('input', () => { clientIssue.value = clientIssue.value.slice(0, 400); });
  appointmentForm.addEventListener('submit', event => {
    event.preventDefault();
    validateName(); validatePhone();
    if(!appointmentForm.reportValidity()) return;
    const request = appointmentForm.querySelector('input[name="request"]:checked').value;
    document.querySelector('#form-success-copy').textContent = request === 'callback' ? 'Вы выбрали обратный звонок. Демозаявка никуда не отправлена.' : 'Вы хотите обсудить визит. Демозаявка никуда не отправлена, встреча не назначена.';
    appointmentForm.reset(); clientName.setCustomValidity(''); clientPhone.setCustomValidity('');
    appointmentForm.hidden = true; formSuccess.hidden = false;
    formSuccess.focus({preventScroll:true});
    formSuccess.scrollIntoView({block:'nearest',behavior:'instant'});
    refreshScroll();
  });
  appointmentForm.querySelector('[type="submit"]').disabled = false;
  document.querySelector('#form-reset').addEventListener('click', () => {
    formSuccess.hidden = true; appointmentForm.hidden = false;
    appointmentForm.reset(); clientName.setCustomValidity(''); clientPhone.setCustomValidity('');
    clientName.focus(); refreshScroll();
  });

  const topics = {
    stopped: {advice:'Вспомните, когда часы остановились и что происходило перед этим. Назовите марку и модель, если они известны.', brief:'Здравствуйте! Часы остановились. Хочу обсудить возможность ремонта.'},
    accuracy: {advice:'Расскажите, часы спешат или отстают и давно ли это началось. Мастер уточнит детали и подскажет, что обсудить дальше.', brief:'Здравствуйте! Часы изменили ход. Хочу обсудить это с мастером.'},
    damage: {advice:'Опишите, что произошло и что изменилось после этого. Возможность ремонта конкретного повреждения уточните у мастера.', brief:'Здравствуйте! У часов есть повреждение. Хочу обсудить возможность ремонта.'},
    other: {advice:'Опишите вопрос своими словами. Название модели или фотография часов помогут начать предметный разговор с мастером.', brief:'Здравствуйте! Хочу обсудить вопрос по моим часам.'}
  };
  let selectedTopic = 'stopped', lastSuggestedIssue = '';
  document.querySelectorAll('[data-topic]').forEach(button => button.addEventListener('click', () => {
    selectedTopic = button.dataset.topic;
    document.querySelectorAll('[data-topic]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#topic-advice').textContent = topics[selectedTopic].advice;
  }));
  document.querySelector('#topic-contact').addEventListener('click', () => {
    if(appointmentForm.hidden) {
      formSuccess.hidden = true; appointmentForm.hidden = false; appointmentForm.reset();
      clientName.setCustomValidity(''); clientPhone.setCustomValidity('');
    }
    if(!clientIssue.value || clientIssue.value === lastSuggestedIssue) {
      lastSuggestedIssue = topics[selectedTopic].brief;
      clientIssue.value = lastSuggestedIssue;
    }
    refreshScroll();
  });

  const dial = document.querySelector('#dial-control');
  const hourHand = document.querySelector('#hour-hand');
  const minuteHand = document.querySelector('#minute-hand');
  const currentTime = document.querySelector('#current-time');
  const status = document.querySelector('#game-status');
  const captureButton = document.querySelector('#capture-moment');
  const momentCard = document.querySelector('#moment-card');
  const modeButtons = [...document.querySelectorAll('[data-hand]')];
  const clock = createClockModel();
  let selectedHand = 'minute', pointerId = null, frozen = false;
  const timeText = () => clock.read().label;
  function updateClock(part = selectedHand) {
    const time = clock.read();
    hourHand.setAttribute('transform', `rotate(${time.hourAngle} 250 250)`);
    minuteHand.setAttribute('transform', `rotate(${time.minuteAngle} 250 250)`);
    currentTime.value = timeText();
    dial.setAttribute('aria-label', `Настройка часов. Сейчас ${timeText()}`);
    dial.dataset.hand = part;
    document.querySelector('#active-hand').textContent = frozen ? 'Момент сохранён' : part === 'minute' ? 'Минутная стрелка' : 'Часовая стрелка';
  }
  function releasePointer() {
    const old = pointerId; pointerId = null; clock.endGesture();
    if(old !== null && dial.hasPointerCapture(old)) dial.releasePointerCapture(old);
    dial.classList.remove('is-dragging');
  }
  function pointTime(event) {
    if(frozen || (pointerId !== null && pointerId !== event.pointerId) || (event.pointerType !== 'mouse' && pointerId !== event.pointerId)) return;
    const rect = dial.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    if(Math.hypot(x,y) < rect.width * .1) { clock.endGesture(); return; }
    const angle = (Math.atan2(y,x) * 180 / Math.PI + 450) % 360;
    const part = event.pointerType === 'mouse' ? (pointerId === event.pointerId ? 'hour' : 'minute') : selectedHand;
    if(part === 'hour') clock.turnHour(angle);
    else clock.turnMinute(angle);
    updateClock(part);
    const hint = 'Время следует за вами. Зафиксируйте момент, когда захотите.';
    if(status.textContent !== hint) status.textContent = hint;
  }
  dial.addEventListener('pointermove',pointTime);
  dial.addEventListener('pointerleave', () => { if(pointerId === null) clock.endGesture(); });
  dial.addEventListener('pointerdown', event => {
    if(frozen || event.button !== 0 || event.isPrimary === false || pointerId !== null) return;
    event.preventDefault(); pointerId = event.pointerId;
    dial.setPointerCapture(pointerId); dial.classList.add('is-dragging');
    dial.focus({preventScroll:true}); pointTime(event);
  });
  dial.addEventListener('pointerup', event => { if(pointerId === event.pointerId) { pointTime(event); releasePointer(); } });
  dial.addEventListener('pointercancel',releasePointer);
  dial.addEventListener('lostpointercapture',releasePointer);
  window.addEventListener('blur',releasePointer);
  document.addEventListener('visibilitychange',() => { if(document.hidden) releasePointer(); });
  function stepTime(delta, part = selectedHand) {
    if(frozen) return;
    releasePointer(); clock.step(delta, part);
    updateClock(part); status.textContent = `Установлено ${timeText()}.`;
  }
  dial.addEventListener('keydown', event => {
    if(!['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home'].includes(event.key)) return;
    event.preventDefault(); if(frozen) return;
    const part = event.shiftKey ? 'hour' : selectedHand;
    if(event.key === 'Home') { releasePointer(); clock.home(part); updateClock(part); }
    else stepTime(['ArrowLeft','ArrowDown'].includes(event.key) ? -1 : 1,part);
  });
  modeButtons.forEach(button => button.addEventListener('click', () => {
    releasePointer(); selectedHand = button.dataset.hand; clock.endGesture();
    modeButtons.forEach(item => item.setAttribute('aria-pressed',String(item === button)));
    updateClock(); status.textContent = selectedHand === 'hour' ? 'Для касания и клавиатуры выбрана часовая стрелка.' : 'Для касания и клавиатуры выбрана минутная стрелка.';
  }));
  document.querySelector('#dial-back').addEventListener('click',() => stepTime(-1));
  document.querySelector('#dial-forward').addEventListener('click',() => stepTime(1));
  function setFrozen(value) {
    releasePointer(); frozen = value; dial.classList.toggle('is-frozen',value);
    captureButton.hidden = value; momentCard.hidden = !value;
    document.querySelectorAll('.dial-modes button,.dial-steps button').forEach(button => button.disabled = value);
    updateClock(); refreshScroll();
  }
  captureButton.addEventListener('click',() => {
    document.querySelector('#saved-time').textContent = timeText(); setFrozen(true);
    status.textContent = `Ваш момент ${timeText()} сохранён на экране. Можно продолжить или начать заново.`;
    document.querySelector('#continue-moment').focus({preventScroll:true});
  });
  document.querySelector('#continue-moment').addEventListener('click',() => {
    setFrozen(false); status.textContent = 'Время снова следует за вами.'; dial.focus({preventScroll:true});
  });
  document.querySelector('#game-reset').addEventListener('click',() => {
    clock.reset(); selectedHand = 'minute';
    modeButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.hand === selectedHand)));
    setFrozen(false); status.textContent = 'Снова 10:10. Создайте новый момент.';
  });
  updateClock();

  // Pointer motion belongs to decorative layers; text and controls never move.
  function setupSectionMotion(selectors) {
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const scenes = selectors.map(selector => ({surface:document.querySelector(selector),x:0,y:0,tx:0,ty:0,frame:0,time:0,rect:null,visible:false}));
    const allowed = () => fine.matches && !reducedMotion.matches && !document.hidden;
    function paint(scene) {
      scene.surface.style.setProperty('--pointer-x',scene.x.toFixed(4));
      scene.surface.style.setProperty('--pointer-y',scene.y.toFixed(4));
    }
    function stop(scene) {
      cancelAnimationFrame(scene.frame); scene.frame=0; scene.time=0;
      scene.x=scene.y=scene.tx=scene.ty=0; scene.rect=null;
      scene.surface.classList.remove('pointer-active','touch-active'); paint(scene);
    }
    function tick(scene,time) {
      scene.frame=0;
      if(!allowed() || !scene.visible) { stop(scene); return; }
      const delta=scene.time?Math.min(3,(time-scene.time)/16.67):1; scene.time=time;
      const ease=1-Math.pow(.78,delta);
      scene.x+=(scene.tx-scene.x)*ease; scene.y+=(scene.ty-scene.y)*ease;
      if(Math.abs(scene.tx-scene.x)+Math.abs(scene.ty-scene.y)<.002) {
        scene.x=scene.tx; scene.y=scene.ty; scene.time=0;
      } else scene.frame=requestAnimationFrame(time=>tick(scene,time));
      paint(scene);
    }
    function schedule(scene) { if(!scene.frame && allowed() && scene.visible) scene.frame=requestAnimationFrame(time=>tick(scene,time)); }
    function move(scene,event) {
      if(!allowed() || !scene.visible || event.pointerType==='touch') return;
      if(!scene.rect) scene.rect=scene.surface.getBoundingClientRect();
      scene.tx=Math.max(-1,Math.min(1,(event.clientX-scene.rect.left)/scene.rect.width*2-1));
      scene.ty=Math.max(-1,Math.min(1,(event.clientY-scene.rect.top)/scene.rect.height*2-1));
      scene.surface.classList.add('pointer-active'); schedule(scene);
    }
    for(const scene of scenes) {
      scene.surface.classList.add('pointer-scene');
      scene.surface.addEventListener('pointerenter',event=>{scene.rect=null;move(scene,event);},{passive:true});
      scene.surface.addEventListener('pointermove',event=>move(scene,event),{passive:true});
      scene.surface.addEventListener('pointerleave',()=>{scene.rect=null;scene.tx=scene.ty=0;scene.surface.classList.remove('pointer-active');schedule(scene);},{passive:true});
      scene.surface.addEventListener('pointercancel',()=>stop(scene),{passive:true});
      scene.surface.addEventListener('focusin',()=>scene.surface.classList.add('focus-active'));
      scene.surface.addEventListener('focusout',event=>{if(!scene.surface.contains(event.relatedTarget))scene.surface.classList.remove('focus-active');});
      scene.surface.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')scene.surface.classList.add('touch-active');},{passive:true});
      scene.surface.addEventListener('pointerup',()=>scene.surface.classList.remove('touch-active'),{passive:true});
    }
    if(window.IntersectionObserver) {
      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        const scene=scenes.find(item=>item.surface===entry.target);
        scene.visible=entry.isIntersecting; if(!scene.visible)stop(scene);
      }));
      scenes.forEach(scene=>observer.observe(scene.surface));
    } else scenes.forEach(scene=>scene.visible=true);
    const reset=()=>scenes.forEach(stop);
    window.addEventListener('scroll',()=>scenes.forEach(scene=>scene.rect=null),{passive:true});
    window.addEventListener('resize',reset,{passive:true});
    window.addEventListener('blur',reset); window.addEventListener('pagehide',reset);
    document.addEventListener('visibilitychange',reset);
    reducedMotion.addEventListener('change',reset); fine.addEventListener('change',reset);
  }
  setupSectionMotion(['.hero','.workshop','.mechanism','.time-game','.contact-section']);
  if(window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to('.hero .gear-a',{rotation:105,transformOrigin:'50% 50%',ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
      gsap.to('.hero .gear-b',{rotation:-140,transformOrigin:'50% 50%',ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
      const mechanism = document.querySelector('.mechanism-scene');
      const split = gsap.timeline({scrollTrigger:{trigger:'#mechanism',start:'top 75%',end:'bottom 35%',scrub:.35}});
      split.to(mechanism.querySelector('.layer-back'),{y:76,x:-25,ease:'none',duration:1},0)
        .to(mechanism.querySelector('.layer-gears'),{y:26,x:-8,ease:'none',duration:1},0)
        .to(mechanism.querySelector('.layer-face'),{y:-76,x:28,ease:'none',duration:1},0)
        .to(mechanism.querySelector('.layer-glass'),{y:-135,x:48,ease:'none',duration:1},0)
        .to(mechanism.querySelector('.gear-a'),{rotation:245,transformOrigin:'50% 50%',ease:'none',duration:1},0)
        .to(mechanism.querySelector('.gear-b'),{rotation:-310,transformOrigin:'50% 50%',ease:'none',duration:1},0)
        .to(mechanism.querySelector('.gear-c'),{rotation:360,transformOrigin:'50% 50%',ease:'none',duration:1},0)
        .to(mechanism.querySelector('.gear-d'),{rotation:-420,transformOrigin:'50% 50%',ease:'none',duration:1},0)
        .to(mechanism.querySelector('.watch-second'),{rotation:220,svgOrigin:'380 390',ease:'none',duration:1},0);
    });
    if(document.fonts) document.fonts.ready.then(refreshScroll);
    window.addEventListener('load',refreshScroll,{once:true});
  }
})();
