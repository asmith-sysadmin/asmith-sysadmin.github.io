"use strict";
(() => {
 const region=document.querySelector('.showcase');
 if(!region)return;
 const slides=Array.from(document.querySelectorAll('.slide'));
 const dots=Array.from(document.querySelectorAll('[data-dot]'));
 const choices=Array.from(document.querySelectorAll('[data-project]'));
 const toggle=document.getElementById('rotation-toggle');
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0, playing=!reduce.matches, timer=null, hovering=false, explicitPlay=false;
 function stopTimer(){if(timer!==null){clearInterval(timer);timer=null;}}
 function syncTimer(){
  stopTimer();
  if(playing&&!document.hidden&&(explicitPlay||(!hovering&&!region.contains(document.activeElement))))timer=setInterval(()=>show(current+1,false),30000);
 }
 function renderToggle(){
  toggle.replaceChildren();
  const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=playing?'Ⅱ':'▶';
  toggle.append(icon,document.createTextNode(playing?'Pause':'Play'));
  toggle.setAttribute('aria-label',playing?'Pause automatic slideshow':'Start automatic slideshow');
 }
 function show(index,manual=true){
  current=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>{slide.hidden=i!==current;});
  [...dots,...choices].forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.dot??button.dataset.project)===current)));
  document.getElementById('slide-count').textContent=String(current+1).padStart(2,'0')+' / 03';
  if(manual){playing=false;explicitPlay=false;renderToggle();document.getElementById('slide-status').textContent=slides[current].getAttribute('aria-label');}
  syncTimer();
 }
 document.getElementById('previous-slide').addEventListener('click',()=>show(current-1));
 document.getElementById('next-slide').addEventListener('click',()=>show(current+1));
 dots.forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.dot))));
 choices.forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.project))));
 toggle.addEventListener('click',()=>{playing=!playing;explicitPlay=playing;renderToggle();syncTimer();});
 region.addEventListener('mouseenter',()=>{hovering=true;explicitPlay=false;syncTimer();});
 region.addEventListener('mouseleave',()=>{hovering=false;syncTimer();});
 region.addEventListener('focusin',()=>{explicitPlay=false;syncTimer();});
 region.addEventListener('focusout',()=>setTimeout(syncTimer,0));
 document.addEventListener('visibilitychange',syncTimer);
 reduce.addEventListener('change',()=>{if(reduce.matches){playing=false;explicitPlay=false;renderToggle();syncTimer();}});
 [...dots,...choices].forEach((button,i,buttons)=>button.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
   event.preventDefault();const offset=event.key==='ArrowRight'?1:-1;
   const group=button.hasAttribute('data-dot')?dots:choices;
   const n=(group.indexOf(button)+offset+group.length)%group.length;
   group[n].focus();show(n);
  }
 }));
 function openDetail(){const target=document.getElementById(location.hash.slice(1));if(target&&target.tagName==='DETAILS')target.open=true;}
 document.querySelectorAll('.slide-copy a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{const detail=document.querySelector(link.getAttribute('href'));if(detail)detail.open=true;}));
 window.addEventListener('hashchange',openDetail);openDetail();renderToggle();show(0,false);
})();

"use strict";
(() => {
 const image=document.getElementById('capture-image');
 if(!image)return;
 const title=document.getElementById('capture-title');
 const description=document.getElementById('capture-description');
 const dialog=document.getElementById('capture-dialog');
 const full=document.getElementById('capture-full');
 const buttons=Array.from(document.querySelectorAll('[data-capture]'));
 buttons.forEach(button=>button.addEventListener('click',()=>{
  image.removeAttribute('width');image.removeAttribute('height');
  image.src=button.dataset.src;
  image.alt=button.dataset.title+': '+button.dataset.description;
  title.textContent=button.dataset.title;
  description.textContent=button.dataset.description;
  buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 }));
 document.getElementById('capture-enlarge').addEventListener('click',()=>{
  full.src=image.src;full.alt=image.alt;
  document.getElementById('capture-full-caption').textContent=title.textContent+' '+description.textContent;
  dialog.showModal();
 });
})();

(() => {

 const form=document.getElementById('contact-form');
 if(!form)return;
 const status=document.getElementById('contact-status');

 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;

  const data=new FormData(form);
  const subject=encodeURIComponent(data.get('subject') || 'Portfolio inquiry');
  const body=encodeURIComponent(
   'Name: '+data.get('name')+'\n'+
   'Email: '+data.get('email')+'\n\n'+
   data.get('message')
  );

  status.textContent='Opening your email application. Please send the message there to complete your inquiry.';
  window.location.href='mailto:austin.smithitrepairs@gmail.com?subject='+subject+'&body='+body;
 });

})();
