/* TrustDocs consolidated interaction entrypoint. Three isolated modules share one load. */

/* ===== app.js ===== */
(function(){
  'use strict';
  const doc = document;
  const isPreview = doc.documentElement.dataset.preview === 'true';
  const pageMap = {'index.html':'home','real-estate-advisory.html':'real-estate','home-loans.html':'loans','documentation.html':'documentation','privacy.html':'privacy'};
  const titles = {home:'TrustDocs | Bengaluru Real Estate, Loans & Documentation','real-estate':'Real Estate Advisory | TrustDocs','loans':'Home Loans | TrustDocs',documentation:'Property Documentation | TrustDocs',privacy:'Privacy and Enquiries | TrustDocs'};
  let active = doc.documentElement.dataset.default || 'home';
  const views = [...doc.querySelectorAll('.view-page')];
  const menuBtn = doc.querySelector('#menuToggle');
  const mobileNav = doc.querySelector('#mobileNav');
  function closeMenu(){mobileNav?.classList.remove('open');menuBtn?.setAttribute('aria-expanded','false');doc.body.classList.remove('menu-open');}
  function showPage(name,fragment,fromHistory=false){
    if(!isPreview)return;
    if(!views.some(v=>v.dataset.view===name))return;
    active=name;
    const openModal=doc.querySelector('#serviceModal');if(openModal?.open)openModal.close();
    views.forEach(v=>{const on=v.dataset.view===name;v.hidden=!on;v.setAttribute('aria-hidden',String(!on));});
    doc.querySelectorAll('[data-page-link]').forEach(a=>a.classList.toggle('active',a.dataset.pageLink===name));
    doc.title=titles[name]||titles.home;
    closeMenu();
    const hash=fragment ? name+'-'+fragment : name;
    if(!fromHistory && location.hash.slice(1)!==hash) history.pushState({view:name},'', '#'+hash);
    if(fragment){requestAnimationFrame(()=>{const el=doc.querySelector('[data-view="'+name+'"] #'+CSS.escape(fragment));if(el)el.scrollIntoView({behavior:'smooth',block:'start'});else scrollTo({top:0,behavior:'auto'});});}
    else scrollTo({top:0,behavior:'auto'});
    initReveals();
  }
  doc.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a)return;
    if(isPreview){
      const raw=a.getAttribute('href')||'';
      const match=raw.match(/^([^?#]+\.html)(?:\?([^#]*))?(?:#(.*))?$/i);
      if(!match)return;
      const file=match[1].split('/').pop();
      if(pageMap[file]){
        e.preventDefault();
        const params=new URLSearchParams(match[2]||''); const service=params.get('service');
        for(const key of ['location','details']){const v=params.get(key);const node=doc.querySelector('#enquiryForm [name="'+key+'"]');if(v&&node)node.value=v.slice(0,node.maxLength>0?node.maxLength:700);}
        if(service){const s=doc.querySelector('#enquiryService');if(s){s.value=service;s.dispatchEvent(new Event('change',{bubbles:true}));}}
        showPage(pageMap[file],match[3]||'');
      }
    }
  });
  menuBtn?.addEventListener('click',()=>{const open=!mobileNav.classList.contains('open');mobileNav.classList.toggle('open',open);menuBtn.setAttribute('aria-expanded',String(open));doc.body.classList.toggle('menu-open',open)});
  doc.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  function initReveals(){
    const els=[...doc.querySelectorAll('.view-page:not([hidden]) .reveal')];
    if(!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add('visible'));return;}
    const io=new IntersectionObserver(entries=>{entries.forEach(ent=>{if(ent.isIntersecting){ent.target.classList.add('visible');io.unobserve(ent.target)}})},{threshold:.07,rootMargin:'0px 0px -25px 0px'});
    els.forEach(el=>io.observe(el));
  }
  if(isPreview){
    const h=location.hash.slice(1);const name=h.split('-')[0];
    if(['home','loans','documentation','privacy'].includes(name)||h.startsWith('real-estate'))active=h.startsWith('real-estate')?'real-estate':name;
    views.forEach(v=>{v.hidden=v.dataset.view!==active;v.setAttribute('aria-hidden',String(v.hidden));});
  }
  doc.querySelectorAll('[data-page-link]').forEach(a=>a.classList.toggle('active',a.dataset.pageLink===active));
  if(isPreview)window.addEventListener('popstate',()=>{const h=location.hash.slice(1);const m=h.match(/^(home|real-estate|loans|documentation|privacy)(?:-(.*))?$/);if(m)showPage(m[1],m[2]||'',true);else showPage('home','',true);});
  initReveals();
  // Buyer and investment tabs
  doc.querySelectorAll('[data-tabs]').forEach(group=>{
    const btns=[...group.querySelectorAll('[data-tab]')];const panels=[...group.querySelectorAll('[data-panel]')];
    btns.forEach(btn=>btn.addEventListener('click',()=>{const sel=btn.dataset.tab;btns.forEach(b=>{const chosen=b===btn;b.classList.toggle('active',chosen);b.setAttribute('aria-selected',String(chosen))});panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===sel));}));
  });
  // documentation filters and details
  const services = {
    'e-Khata':{category:'records',sub:'Digital municipal property record',description:'Assistance with e-Khata applications, including property identification and supporting ownership and tax records.',docs:['Registered sale deed or transfer document','Existing Khata or property identification details, if available','Recent property tax paid receipt','Owner identification and other required records']},
    'Khata Transfer':{category:'records',sub:'Update municipal ownership records',description:'Help with a Khata transfer following a registered purchase, gift or inheritance.',docs:['Registered transfer document','Existing Khata or property ID','Latest property tax receipt','Applicant identification']},
    'New Khata':{category:'records',sub:'First-time municipal property registration',description:'Assistance with an initial Khata application where no existing record is available, subject to local requirements.',docs:['Registered title deed','Property identifiers and location','Relevant approvals and tax records','Owner identification']},
    'BESCOM Name Change':{category:'utilities',sub:'Update electricity account details',description:'Support for requesting a change in the name on a BESCOM electricity connection.',docs:['Latest electricity bill or account number','Registered ownership or transfer document','Applicant ID','Additional forms as required']},
    'Property Tax Name Change':{category:'utilities',sub:'Update the taxpayer name',description:'Assistance with an application to change the name in municipal property-tax records after ownership transfer.',docs:['Property ID and recent tax receipt','Registered sale or transfer deed','Available Khata details','Owner identification']},
    'Family Tree Certificate':{category:'other',sub:'Family information for inheritance matters',description:'Help preparing family information and supporting records for a family tree or legal-heir-related application.',docs:['Applicant identification','Family-member information','Death certificate if relevant','Case-specific supporting records']},
    'Property Registration':{category:'other',sub:'Deed registration coordination',description:'Help preparing paperwork and coordinating applicable registration formalities at the Sub-Registrar’s Office.',docs:['Draft deed and transaction details','Buyer and seller identification','Existing ownership records','Other property-specific papers']},
    'MODT Removal':{category:'other',sub:'Mortgage release paperwork',description:'Assistance with lender discharge paperwork and the applicable process for releasing a registered MODT after loan repayment.',docs:['Loan closure or no-dues confirmation','Original MODT registration reference','Bank release papers','Owner and property identification']},
    'Encumbrance Certificate (EC)':{category:'records',sub:'Request registered transaction information',description:'Help applying for an EC for a specified period. An EC reflects recorded transactions and does not replace a full title search.',docs:['Property address and identifying details','Deed number if available','Sub-Registrar Office details','Requested date range']}
  };
  window.TrustDocsServices=services;
  doc.querySelectorAll('.doc-card').forEach(card=>{
    card.addEventListener('click',()=>{
      const name=card.dataset.service;const s=services[name];if(!s)return;
      const modal=doc.querySelector('#serviceModal');
      modal.querySelector('[data-modal-title]').textContent=name;
      modal.querySelector('[data-modal-sub]').textContent=s.sub;
      modal.querySelector('[data-modal-description]').textContent=s.description;
      modal.querySelector('[data-modal-docs]').replaceChildren(...s.docs.map(t=>{const li=doc.createElement('li');li.textContent=t;return li}));
      const btn=modal.querySelector('[data-modal-enquire]');btn.setAttribute('href','index.html?service='+encodeURIComponent(name)+'#contact');
      modal.showModal();
    });
  });
  doc.querySelector('[data-close-modal]')?.addEventListener('click',()=>doc.querySelector('#serviceModal')?.close());
  doc.querySelector('#serviceModal')?.addEventListener('click',e=>{const m=e.currentTarget;const r=m.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)m.close();});
  doc.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    const val=btn.dataset.filter;doc.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===btn));
    doc.querySelectorAll('.doc-card').forEach(card=>card.hidden=val!=='all'&&card.dataset.category!==val);
  }));
  // EMI calculator
  const amount=doc.querySelector('#loanAmount'),rate=doc.querySelector('#loanRate'),years=doc.querySelector('#loanYears');
  const fmt=new Intl.NumberFormat('en-IN',{maximumFractionDigits:0});
  function money(n){return '₹'+fmt.format(Math.round(n));}
  function emi(){if(!amount||!rate||!years)return;const p=+amount.value,r=+rate.value/1200,n=+years.value*12;const factor=(1+r)**n;const m=(p*r*factor)/(factor-1);const interest=m*n-p;
    doc.querySelector('#emiValue').textContent=money(m);
    doc.querySelector('#amountValue').textContent=money(p);
    doc.querySelector('#rateValue').textContent=Number(rate.value).toFixed(1)+'%';
    doc.querySelector('#yearsValue').textContent=years.value+' years';
    doc.querySelector('#interestValue').textContent=money(interest);
    doc.querySelector('#repaymentValue').textContent=money(m*n);
  }
  [amount,rate,years].forEach(input=>input?.addEventListener('input',emi));emi();
  // Contact / WhatsApp enquiry
  const form=doc.querySelector('#enquiryForm');
  if(form){
    const query=new URLSearchParams(location.search);const pre=query.get('service');if(pre){const field=doc.querySelector('#enquiryService');if(field)field.value=pre;}
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!form.reportValidity())return;
      const data=new FormData(form);const name=(data.get('name')||'').toString().trim(),phone=(data.get('phone')||'').toString().replace(/\D/g,'');
      const err=doc.querySelector('#formError');if(phone.length!==10){if(err)err.textContent='Please enter a valid 10-digit mobile number';return;}if(err)err.textContent='';
      const message=`Hello TrustDocs,\nI would like assistance with ${data.get('service')}.\nName: ${name}\nPhone: +91${phone}\nLocation: ${data.get('location')}\nDetails: ${data.get('details')||'Not provided'}`;
      window.open('https://wa.me/919180249063?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
    });
  }
})();


/* ORBIT Motion v20: preloaded visual states, robust reveals and scrubbed scroll storytelling */
(function(){
  'use strict';
  const doc=document;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover: hover) and (pointer:fine)').matches;
  const $=(sel,root=doc)=>root.querySelector(sel);
  const $$=(sel,root=doc)=>[...root.querySelectorAll(sel)];
  const visibleViews=()=>$$('.view-page').filter(v=>!v.hidden);
  const nextFrame=fn=>requestAnimationFrame(fn);
  let scrollPending=false;
  const hero=$('.hero'), heroMedia=$('.hero-media'), photoOverlay=$('.hero-photo-overlay');
  const sceneNames={'residences':['01','REAL ESTATE'],'home-loans':['02','HOME LOANS'],'documents':['03','PROPERTY RECORDS']};
  const asset=stem=>(doc.documentElement.dataset.preview==='true'&&window.__trustAssets?.[stem])||`${stem}-1920.webp`;
  const photos={};
  if(fine){for(const stem of ['home-loans','documents']){
    const im=new Image();im.decoding='async';im.src=asset(stem);photos[stem]=im;
  }}
  if(photoOverlay) photoOverlay.style.backgroundImage=`url('${asset('residences')}')`;
  // Hover/focus previews use an already-preloaded image. The counter changes with the scene.
  function setHeroScene(stem){
    if(!heroMedia||!photoOverlay) return;
    const scene=sceneNames[stem]||sceneNames.residences;
    const n=$('.hero-scene-number'),title=$('.hero-scene-title');
    if(n)n.textContent=scene[0]; if(title)title.textContent=scene[1];
    $$('.hero-fact').forEach(a=>a.classList.toggle('is-active',a.dataset.previewPhoto===stem));
    if(stem==='residences'){heroMedia.classList.remove('is-previewing');return;}
    photoOverlay.style.backgroundImage=`url('${asset(stem)}')`;
    heroMedia.classList.add('is-previewing');
  }
  $$('.hero-fact[data-preview-photo]').forEach(a=>{
    if(fine){a.addEventListener('pointerenter',()=>setHeroScene(a.dataset.previewPhoto));a.addEventListener('pointerleave',()=>setHeroScene('residences'));}
    a.addEventListener('focus',()=>setHeroScene(a.dataset.previewPhoto));
    a.addEventListener('blur',()=>setHeroScene('residences'));
  });
  // Pointer light, kept subtle on large screens and disabled for touch/reduced motion.
  if(hero&&fine&&!reduce){hero.addEventListener('pointermove',e=>{
    const b=hero.getBoundingClientRect();
    hero.style.setProperty('--pointer-x', `${((e.clientX-b.left)/b.width*100).toFixed(1)}%`);
    hero.style.setProperty('--pointer-y', `${((e.clientY-b.top)/b.height*100).toFixed(1)}%`);
  },{passive:true})}
  // Start reveal animations only when targets enter the viewport. Nothing is hidden first.
  let observer=null;
  function setRevealObserver(){
    observer?.disconnect();
    const targets=visibleViews().flatMap(v=>$$('.service-card,.journey-photo,.large-photo,.about-visual,.method-card,.panel,.doc-card',v));
    const unique=[...new Set(targets)];
    if(reduce||!('IntersectionObserver' in window)) return;
    observer=new IntersectionObserver(entries=>{
      entries.forEach(({target,isIntersecting})=>{
        if(!isIntersecting)return;
        if(!target.classList.contains('motion-seen')){
          target.classList.add('motion-seen');
          if(!target.closest('[hidden]'))target.classList.add('motion-in');
        }
        observer.unobserve(target);
      });
    },{threshold:.12,rootMargin:'0px 0px -32px 0px'});
    unique.forEach((el,i)=>{
      el.classList.add('motion-target');
      if(el.classList.contains('service-card')||el.classList.contains('bank-item')||el.classList.contains('doc-card')||el.classList.contains('method-card')) el.style.setProperty('--delay',`${(i%3)*95}ms`);
      if(!el.classList.contains('motion-seen'))observer.observe(el);
    });
  }
  // Sticky visual story: all three images are in the DOM, so no network work during scroll.
  const journey=$('[data-scroll-story]');
  const visuals=journey?$$('.journey-visual',journey):[];
  const steps=$$('.journey-step');
  const journeyLabel=journey?$('.photo-label strong',journey):null;
  const captions=['Compare the home, location and total cost','Review loan terms and repayment commitments','Identify which property records require attention'];
  let currentStep=0;
  let manualUntil=0;
  function selectStep(i){
    if(i<0||i>=visuals.length)return;
    currentStep=i;
    visuals.forEach((visual,n)=>visual.classList.toggle('is-active',n===i));
    steps.forEach((step,n)=>{
      step.classList.toggle('is-current',n===i);
      step.setAttribute('aria-pressed',String(n===i));
    });
    if(journeyLabel) journeyLabel.textContent=captions[i];
  }
  steps.forEach((step,i)=>{
    step.addEventListener('click',()=>{manualUntil=performance.now()+1300;selectStep(i);step.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});});
    step.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();manualUntil=performance.now()+1300;selectStep(i);step.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});}});
  });
  if(steps.length)selectStep(0);
  // Deterministic scroll progress, with the closest step to the reading line becoming active.
  function syncJourney(){
    if(!journey||journey.closest('[hidden]')||!steps.length)return;
    const ref=innerHeight*.47;
    let winner=0,dist=Infinity;
    steps.forEach((step,i)=>{
      const r=step.getBoundingClientRect();
      const d=Math.abs(r.top+r.height*.45-ref);
      if(d<dist){dist=d;winner=i}
    });
    if(performance.now()>=manualUntil && winner!==currentStep)selectStep(winner);
    const sect=journey.closest('.journey-section')||journey;
    const rect=sect.getBoundingClientRect();
    const max=Math.max(1,rect.height-innerHeight*.75);
    const progress=Math.max(0,Math.min(1,(-rect.top+innerHeight*.3)/max));
    journey.style.setProperty('--journey-progress',(progress*100).toFixed(1)+'%');
  }
  // Scroll rendering is batched to one frame and does not do layout work on every mousemove.
  function renderScroll(){
    scrollPending=false;
    const top=scrollY||doc.documentElement.scrollTop;
    const total=Math.max(1,doc.documentElement.scrollHeight-innerHeight);
    const bar=$('#progress');if(bar)bar.style.transform=`scaleX(${Math.max(0,Math.min(1,top/total))})`;
    $('.site-head')?.classList.toggle('is-scrolled',top>36);
    const h=visibleViews().map(v=>$('.hero',v)).find(Boolean);
    if(h&&!reduce){
      const p=Math.max(0,Math.min(1,top/Math.max(1,h.offsetHeight)));
      h.style.setProperty('--hero-parallax',(p*52).toFixed(0)+'px');
      h.style.setProperty('--hero-opacity',(1-p*.28).toFixed(3));
    }
    syncJourney();
  }
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;nextFrame(renderScroll)}},{passive:true});
  addEventListener('resize',()=>{if(!scrollPending){scrollPending=true;nextFrame(renderScroll)}},{passive:true});
  // Cards use a pointer-following reflection, no 3D rotation that damages text readability.
  if(fine&&!reduce){$$('.service-card').forEach(card=>{
    card.addEventListener('pointermove',e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty('--card-x',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      card.style.setProperty('--card-y',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    },{passive:true});
  })}
  // Small, requestAnimationFrame-batched lighting changes on process cards.
  // Static geometry is cached during pointer move and the effect is disabled on touch.
  if(fine&&!reduce){
    $$('.method-card').forEach(card=>{
      let frame=0,lastX=50,lastY=20;
      card.addEventListener('pointermove',e=>{
        const rect=card.getBoundingClientRect();
        lastX=((e.clientX-rect.left)/Math.max(1,rect.width)*100).toFixed(1);
        lastY=((e.clientY-rect.top)/Math.max(1,rect.height)*100).toFixed(1);
        if(frame)return;
        frame=requestAnimationFrame(()=>{
          frame=0;
          card.style.setProperty('--method-x',lastX+'%');
          card.style.setProperty('--method-y',lastY+'%');
        });
      },{passive:true});
    });
  }
  // Observes SPA preview page switches and reinitializes page-specific scroll animations.
  const mo=new MutationObserver(records=>{
    if(!records.some(r=>r.attributeName==='hidden'))return;
    nextFrame(()=>{setRevealObserver();renderScroll()});
  });
  $$('.view-page').forEach(view=>mo.observe(view,{attributes:true,attributeFilter:['hidden']}));
  // Use native view transitions if available, but never delay or intercept destination links.
  if(!reduce&&'startViewTransition' in doc){ doc.documentElement.classList.add('native-view-transitions'); }
  setRevealObserver();nextFrame(renderScroll);
})();


/* ===== enhance.js ===== */
(function(){
 'use strict';
 const doc=document;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const $=(sel,root=doc)=>root.querySelector(sel);
 const $$=(sel,root=doc)=>[...root.querySelectorAll(sel)];
 const form=$('#enquiryForm'), service=$('#enquiryService');
 const serviceHint=$('#quickContext');
 const prompts={
   'Buying a Home':'Tell us your budget, preferred localities and home configuration.',
   'Property Investment':'Tell us the areas, ticket size and holding period you are considering.',
   'Home Loan Assistance':'Tell us the loan amount or property value, if known.',
   'Other Property Assistance':'Tell us whether you need Khata, EC, registration or another property record.'
 };
 function syncQuick(){
   const current=service?.value||'';
   $$('[data-quick-service]').forEach(btn=>{const on=btn.dataset.quickService===current;btn.classList.toggle('chosen',on);btn.setAttribute('aria-pressed',String(on));});
   if(serviceHint)serviceHint.textContent=prompts[current]||'Choose your requirement and share the property location. We will respond with the next information needed.';
 }
 $$('[data-quick-service]').forEach(button=>button.addEventListener('click',()=>{
   if(service){service.value=button.dataset.quickService;service.dispatchEvent(new Event('change',{bubbles:true}));}
 }));
 service?.addEventListener('change',syncQuick);syncQuick();
 // Filter by lender type, without implying an association with TrustDocs.
 const bankCards=$$('.bank-item[data-bank-type]');
 $$('[data-bank-filter]').forEach(btn=>btn.addEventListener('click',()=>{
   const category=btn.dataset.bankFilter;
   $$('[data-bank-filter]').forEach(b=>{const yes=b===btn;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
   bankCards.forEach(card=>{card.hidden=category!=='all'&&card.dataset.bankType!==category;});
   const status=$('#bankFilterStatus');if(status)status.textContent=`Showing ${bankCards.filter(c=>!c.hidden).length} lenders`;
 }));
 // Copy service document checklist only from the current verified-in-page modal, no generated claims.
 const modal=$('#serviceModal');
 $('#copyChecklist')?.addEventListener('click',async()=>{
   if(!modal)return;
   const title=$('[data-modal-title]',modal)?.textContent?.trim()||'Property documentation';
   const docs=$$('[data-modal-docs] li',modal).map(li=>'• '+li.textContent.trim());
   const content=[title,'Commonly requested documents',...docs,'Requirements vary by property and authority.'].join('\n');
   try{await navigator.clipboard.writeText(content);$('#copyChecklist').textContent='Checklist copied';}
   catch{const ta=doc.createElement('textarea');ta.value=content;doc.body.append(ta);ta.select();try{doc.execCommand('copy');$('#copyChecklist').textContent='Checklist copied';}catch{}ta.remove();}
 });
 $$('.doc-card').forEach(card=>card.addEventListener('click',()=>{const b=$('#copyChecklist');if(b)b.textContent='Copy document checklist';}));
 // Mobile conversion control is hidden until reader leaves the first viewport, and hides over the form.
 const mobile=$('.mobile-enquire');
 function mobileState(){
   if(!mobile)return;
   const contact=$('#contact');const contactVisible=!!contact&&!contact.closest('[hidden]')&&contact.getBoundingClientRect().top<innerHeight*.85;
   const mainView=$('.view-page:not([hidden])');
   mobile.classList.toggle('visible',innerWidth<=820&&scrollY>470&&!contactVisible&&!!mainView);
 }
 addEventListener('scroll',mobileState,{passive:true});addEventListener('resize',mobileState,{passive:true});mobileState();
 // Fix CTA copy on small screens and prevent motion when reduced-motion is enabled.

 // Optional analytics events. No analytics service is installed and no private fields are sent.
 function analytics(action,section){
   if(Array.isArray(window.dataLayer))window.dataLayer.push({event:'trustdocs_interaction',action,section});
 }
 doc.addEventListener('click',e=>{
   const a=e.target.closest('a[href]');if(!a)return;
   const href=a.getAttribute('href')||'';
   if(/^(?:index|real-estate-advisory|home-loans|documentation)\.html/.test(href))analytics('page_navigation',href.split(/[?#]/)[0]);
   if(a.matches('.btn,.service-card,.journey-actions a'))analytics('service_cta',a.textContent.trim().slice(0,60));
 });
 form?.addEventListener('submit',()=>{
   const number=(form.elements.phone?.value||'').replace(/\D/g,'');
   if(form.checkValidity()&&/^\d{10}$/.test(number))analytics('whatsapp_enquiry_started','contact');
 });
 if(reduce)doc.documentElement.classList.add('no-motion');
})();


/* ===== upgrade.js ===== */
(function(){
 'use strict';
 const doc=document;
 const $=(q,root=doc)=>root.querySelector(q);
 const $$=(q,root=doc)=>[...root.querySelectorAll(q)];
 const preview=doc.documentElement.dataset.preview==='true';
 const fieldURL=(service,location,details)=>{
    const qs=new URLSearchParams({service,location,details});
    return 'index.html?'+qs.toString()+'#contact';
 };
 function toEnquiry(service,location,details){
    const url=fieldURL(service,location,details);
    const a=doc.createElement('a');a.href=url;a.style.display='none';doc.body.append(a);a.click();a.remove();
 }
 async function copyText(s){
    try{await navigator.clipboard.writeText(s);return true;}
    catch {try{const t=doc.createElement('textarea');t.value=s;t.style.position='fixed';t.style.top='-4000px';doc.body.append(t);t.select();const ok=doc.execCommand('copy');t.remove();return ok;}catch{return false;}}
 }
 // 3-step property brief. This never suggests unverifiable listings.
 const form=$('#finderForm');
 if(form){
   const steps=$$('[data-finder-step]',form),result=$('#finderResult');
   const progress=$('#finderProgressBar'),number=$('.finder-counter'),text=$('#finderStepText');
   const next=$('#finderNext'),back=$('#finderBack'),controls=$('.finder-controls',form),err=$('#finderError');
   let current=0,prepared='';
   function paint(){
     steps.forEach((s,i)=>s.hidden=i!==current);
     result.hidden=current!==3;controls.hidden=current===3;
     if(progress)progress.style.width=(current>=3?100:((current+1)/3*100))+'%';
     if(number)number.innerHTML=(current>=3?'03':'0'+(current+1))+' <i>/ 03</i>';
     if(text)text.textContent='Step '+(current+1)+' of 3';
     if(back)back.hidden=current===0;
     if(next)next.innerHTML=(current===2?'Prepare brief':'Continue')+' <span class="arr">→</span>';
     if(err)err.textContent='';
   }
   function checkStep(){
     const inputs=$$('input,select',steps[current]).filter(el=>el.required);
     for(const input of inputs){if(!input.checkValidity()){if(err)err.textContent='Please complete this field before continuing.';input.focus();return false;}}
     return true;
   }
   function gather(){
     const v=Object.fromEntries(new FormData(form));
     const area=[v.area,v.landmark?.trim()].filter(Boolean).join(', ');
     const rows=[['Purpose',v.purpose],['Preferred area',area],['Budget',v.budget],['Configuration',v.bhk],['Timeline',v.timeline],['Home loan',v.loan]];
     const summary=$('#finderSummary');
     if(summary){summary.replaceChildren(...rows.map(([label,value])=>{const x=doc.createElement('div');x.className='summary-item';const s=doc.createElement('span');s.textContent=label;const b=doc.createElement('strong');b.textContent=value;x.append(s,b);return x;}));}
     const guidance=v.purpose==='Property Investment'?'Before investing, compare the total acquisition cost, holding period, construction stage and local rental conditions. Investment returns are not guaranteed.':'Before booking, compare the floor plan, commute, possession status and the full cost of ownership.';
     const adv=$('#finderAdvice');if(adv)adv.textContent=guidance;
     prepared=['TrustDocs property requirement',...rows.map(([l,t])=>l+': '+t)].join('\n');
     return {v,area};
   }
   function prepare(){gather();current=3;paint();$('#finderResult')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}
   next?.addEventListener('click',()=>{if(!checkStep())return;if(current<2){current++;paint();}else prepare();});
   back?.addEventListener('click',()=>{if(current>0){current--;paint();}});
   $('#finderEdit')?.addEventListener('click',()=>{current=0;paint();});
   $('#finderCopy')?.addEventListener('click',async e=>{const ok=await copyText(prepared);e.currentTarget.textContent=ok?'Brief copied':'Copy unavailable';});
   $('#finderEnquire')?.addEventListener('click',()=>{const {v,area}=gather();toEnquiry(v.purpose,area,prepared.slice(0,680));});
   form.addEventListener('submit',e=>{e.preventDefault();});
   paint();
 }
 // Documentation assistant uses the SAME service data as the existing service dialogs.
 const docForm=$('#docAssistantForm');
 if(docForm){
   const select=$('#docService'),type=$('#docPropertyType'),wrap=$('#docSituationWrap'),situ=$('#docSituation'),lbl=$('#docSituationLabel');
   const empty=$('#docAssistantEmpty'),result=$('#docAssistantResult'),title=$('#docChecklistTitle'),intro=$('#docChecklistIntro'),list=$('#docChecklist'),status=$('#docActionStatus');
   const map={
      'e-Khata':{prompt:'Do you have an existing Khata or municipal property ID?',choices:['Yes','No','Not sure'],extras:{'No':['Available property identifiers or local-body assessment records, if any']}},
      'Khata Transfer':{prompt:'What is the reason for the ownership change?',choices:['Registered purchase','Gift','Inheritance','Other / unsure'],extras:{'Inheritance':['Relevant inheritance or succession-related documents, where applicable'],'Gift':['Registered gift deed, if applicable']}},
      'New Khata':{prompt:'Does the property have a prior municipal record?',choices:['Not available','Available','Not sure'],extras:{}},
      'BESCOM Name Change':{prompt:'Do you have the latest electricity bill or account number?',choices:['Yes','No','Not sure'],extras:{'No':['BESCOM account details or last bill, once obtained']}},
      'Property Tax Name Change':{prompt:'Is the property tax ID or latest receipt available?',choices:['Yes','No','Not sure'],extras:{'No':['Property tax identification or existing assessment record, when available']}},
      'Family Tree Certificate':{prompt:'Is this request related to the death of a family member?',choices:['Yes','No','Not sure'],extras:{'Yes':['Death certificate, when relevant to the application']}},
      'Property Registration':{prompt:'What kind of deed is involved?',choices:['Sale deed','Gift deed','Other / unsure'],extras:{'Gift deed':['Gift deed draft and applicable donor/recipient information']}},
      'MODT Removal':{prompt:'Has the home loan been fully repaid?',choices:['Yes, fully repaid','No / outstanding','Not sure'],extras:{'Yes, fully repaid':['Lender loan-closure or no-dues confirmation']},note:{'No / outstanding':'MODT release generally follows loan closure and applicable lender discharge procedures. Confirm your position with the lender.'}},
      'Encumbrance Certificate (EC)':{prompt:'Do you know the period for which you need the EC?',choices:['Yes','No','Not sure'],extras:{'No':['The start and end dates of the requested period, once decided']}}
   };
   let generated='';
   select?.addEventListener('change',()=>{
      const d=map[select.value];wrap.hidden=!d;result.hidden=true;empty.hidden=false;
      if(!d)return;
      lbl.textContent=d.prompt;
      situ.replaceChildren(...[new Option('Choose an answer',''),...d.choices.map(c=>new Option(c,c))]);
      situ.required=true;
      if(status)status.textContent='';
   });
   docForm.addEventListener('submit',e=>{
      e.preventDefault();
      if(!docForm.reportValidity())return;
      const service=select.value,s=window.TrustDocsServices?.[service],choice=situ.value,meta=map[service];
      if(!s)return;
      const base=s.docs||[];
      const extra=meta?.extras?.[choice]||[];
      const lines=[...new Set([...base,...extra])];
      title.textContent=service;
      intro.textContent=s.description+' Property: '+type.value+'. '+(meta?.note?.[choice]||'');
      list.replaceChildren(...lines.map(t=>{const li=doc.createElement('li');li.textContent=t;return li;}));
      generated=[service,'Property type: '+type.value,meta.prompt+' '+choice,'Commonly requested documents',...lines.map(a=>'• '+a),'Final requirements depend on the authority and property.'].join('\n');
      result.hidden=false;empty.hidden=true; if(status)status.textContent='';
   });
   $('#docCopy')?.addEventListener('click',async()=>{const ok=await copyText(generated);if(status)status.textContent=ok?'Checklist copied':'Copy is unavailable in this browser';});
   $('#docEnquire')?.addEventListener('click',()=>{
      const detail=[select.value, type.value,situ.value].join(' | ');
      toEnquiry(select.value,'',detail);
   });
 }
 // Add query-prefill for production pages too. Preview mode is handled in app.js.
 const contact=$('#enquiryForm');
 if(contact){
   const qs=new URLSearchParams(location.search);
   const fields={service:$('#enquiryService'),location:contact.elements.location,details:contact.elements.details};
   for(const [key,node] of Object.entries(fields)){const v=qs.get(key);if(node&&v)node.value=v.slice(0,node.maxLength>0?node.maxLength:700);}
   if(fields.service&&qs.get('service'))fields.service.dispatchEvent(new Event('change',{bubbles:true}));
 }
})();



/* Signature v26: image-only entrance and precise pointer affordances */
(()=>{
 'use strict';
 const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const revealTargets=()=>[...document.querySelectorAll('.view-page:not([hidden]) .v26-services .service-img,.view-page:not([hidden]) .v26-method .method-card:first-child')];
 if(!reduce&&'IntersectionObserver' in window){
   const io=new IntersectionObserver(entries=>{
     for(const entry of entries){if(!entry.isIntersecting)continue;
       entry.target.classList.add('v26-photo-visible');io.unobserve(entry.target);}
   },{threshold:0.08,rootMargin:'0px 0px 80px 0px'});
   revealTargets().forEach(el=>io.observe(el));
   // Covers self-contained preview page switches without delaying content visibility.
   const mo=new MutationObserver(()=>revealTargets().filter(el=>!el.classList.contains('v26-photo-visible')).forEach(el=>io.observe(el)));
   document.querySelectorAll('.view-page').forEach(v=>mo.observe(v,{attributes:true,attributeFilter:['hidden']}));
 }
 if(fine&&!reduce){
   // Fine pointer only, affects image highlights but never text or layout.
   document.querySelectorAll('.v26-services .service-card').forEach(card=>{
     card.addEventListener('pointermove',e=>{
       const b=card.getBoundingClientRect();
       card.style.setProperty('--card-x',((e.clientX-b.left)/b.width*100).toFixed(1)+'%');
       card.style.setProperty('--card-y',((e.clientY-b.top)/b.height*100).toFixed(1)+'%');
     },{passive:true});
   });
 }
})();
