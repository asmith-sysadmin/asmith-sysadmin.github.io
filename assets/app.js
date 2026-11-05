'use strict';
const el=id=>document.getElementById(id);
const copy={windows:{title:'Windows, ready for your workday.',description:'A classic setup wizard for an Intel or AMD 64-bit computer. Includes the components needed to run without Wi-Fi.',id:'windows-x64'},linux:{title:'A Linux package, built for your desktop.',description:'Install the current Kali Linux x64 demo package. Other Debian-family systems need separate testing. Initial dependency installation may require Internet access.',id:'linux-amd64'},mac:{title:'A Mac version comes next.',description:'A macOS package is planned. It will appear here after it is built, signed, and tested on supported Apple hardware.'},mobile:{title:'A smaller screen. A later release.',description:'Android and iOS versions need their own packaging and testing. Mobile downloads are not available yet.'}};
let release=null,selected='windows',catalog=[];
function render(){
 release=catalog.find(r=>r.id===copy[selected].id)||null;
 const available=Boolean(release),linux=selected==='linux';
 el('platform-title').textContent=!available&&copy[selected].id?(selected==='windows'?'Windows':'Linux')+' installer not included.':copy[selected].title;el('platform-description').textContent=!available&&copy[selected].id?'This portfolio preview does not include that installer. You can explore the project and tutorials, or select an available package.':copy[selected].description;
 el('verify-file').disabled=!available;
 el('verify-command').closest('details').hidden=!available;
 ['release-details','release-warning','release-links'].forEach(id=>el(id).hidden=!available);
 el('release-status').textContent=available?'DEMO RELEASE':'NOT AVAILABLE YET';
 el('release-version').textContent=available?'v'+release.version+' · '+release.revision:'';
 const link=el('download');link.classList.toggle('disabled',!available);link.setAttribute('aria-disabled',String(!available));
 link.replaceChildren(document.createTextNode(available?(linux?'Download Linux .deb package':'Download Windows installer'):'Installer not available yet'));
 if(available){
  link.href='/downloads/'+encodeURIComponent(release.id);const arrow=document.createElement('span');arrow.textContent='↓';link.append(arrow);
  el('requirements').textContent=release.requirements;
  el('setup-languages').textContent=linux?'System package manager · app in English':'English / Spanish · app in English';
  el('package-details').textContent=(linux?'DEB package':'EXE installer')+' · '+(release.bytes/1000000).toFixed(1)+' MB · x64';
  el('warning-title').textContent=linux?'Demo package · unsigned':'Demo release · unsigned';
  el('warning-body').textContent=linux?'Package construction and backend checks passed. Linux GUI, scanner, and printing tests are pending. Kali compatibility depends on system package availability.':'Windows installation and first-launch testing are pending. This is not yet a production-verified release.';
  el('release-links').querySelector('a').href='/checksums/'+encodeURIComponent(release.id);
  el('expected-hash').value=release.sha256;
  el('verify-command').textContent=linux?release.installCommand.replace('sudo apt install','sha256sum'):"Get-FileHash -Algorithm SHA256 -LiteralPath '.\\"+release.filename+"'";
 }else{link.removeAttribute('href');el('expected-hash').value='No published package for this platform.';}
 el('copy-hash').disabled=!available;el('copy-hash').textContent='Copy checksum';
 el('verify-result').textContent=available?'Waiting for a file for the selected platform.':'Choose an available platform before verifying a file.';el('verify-result').className='';el('verify-file').value='';
 el('download-note').textContent=available?(linux?'Initial dependencies may require Internet. The app works offline after setup.':'No registration required. No app usage reports sent to Northstar.'):'This installer is not included in this preview. Select a platform marked Demo for an available package.';
 document.querySelectorAll('[data-platform]').forEach(b=>{const active=b.dataset.platform===selected;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
}
document.querySelectorAll('[data-platform]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.platform;render();}));
const ua=navigator.userAgent;
if(/Windows/i.test(ua))el('device-hint').textContent='This browser appears to be on Windows. Confirm Intel/AMD 64-bit compatibility before installing.';
else if(/Android|iPhone|iPad/i.test(ua))el('device-hint').textContent='You appear to be on mobile. Choose a package for a separate compatible computer.';
else if(/Linux/i.test(ua))el('device-hint').textContent='This browser appears to be on Linux. Select Linux and check the system requirements before installing.';
else if(/Mac/i.test(ua))el('device-hint').textContent='This browser appears to be on macOS. A Mac installer is not available yet.';
fetch('/releases.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{catalog=data.releases;if(!Array.isArray(catalog)||catalog.some(r=>!/^[a-f0-9]{64}$/.test(r.sha256)))throw Error();
 if(data.demoMode){
  el('demo-notice').hidden=false;
  const section=el('newsletter-form').closest('section');
  section.replaceChildren();
  const note=document.createElement('div');note.className='newsletter-demo';
  const heading=document.createElement('h2');heading.textContent='Just here to explore.';
  const text=document.createElement('p');text.textContent='Newsletter signup is paused during this portfolio preview. No account or email is needed to explore the work.';
  note.append(heading,text);section.append(note);
 }
 document.querySelectorAll('[data-platform]').forEach(b=>{if(copy[b.dataset.platform].id&&!catalog.some(r=>r.id===copy[b.dataset.platform].id)){b.querySelector('.availability').textContent='Not included';b.querySelector('.availability').classList.add('muted');}});
 if(!catalog.some(r=>r.id===copy[selected].id)&&catalog.length){const choice=Object.keys(copy).find(k=>copy[k].id===catalog[0].id);if(choice)selected=choice;}
 render();}).catch(()=>{catalog=[];render();el('release-status').textContent='RELEASE DATA UNAVAILABLE';el('expected-hash').value='Release information could not be loaded. Please try again later.';});
el('copy-hash').addEventListener('click',async()=>{if(!release)return;try{await navigator.clipboard.writeText(release.sha256);el('copy-hash').textContent='Copied';}catch{el('expected-hash').select();el('copy-hash').textContent='Select and copy the checksum above';}});
el('verify-file').addEventListener('change',async()=>{
 const file=el('verify-file').files[0],result=el('verify-result'),target=release;result.className='';if(!file)return;
 if(!target||!crypto.subtle){result.textContent='Verification needs release information and a secure browser context (HTTPS or localhost).';return;}
 if(file.size!==target.bytes){result.textContent='Does not match: the file size differs from this release. Do not install it as this version.';result.className='bad';return;}
 el('verify-file').disabled=true;result.textContent='Checking your file on this device…';
 try{const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());if(release!==target){result.textContent='Platform selection changed. Choose the file again.';return;}const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),match=actual===target.sha256;result.textContent=match?'Match: this file has exactly the same SHA-256 checksum as the selected release. Device testing is still pending.':'Does not match this release. Do not install this file; download a fresh copy from your trusted source.';result.className=match?'good':'bad';}catch{result.textContent='Your browser could not check this file. Use the terminal command below.';}finally{el('verify-file').disabled=false;}
});
el('newsletter-form').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;el('signup-status').textContent='Saving your signup…';try{const response=await fetch('/newsletter',{method:'POST',body:new URLSearchParams(new FormData(form)),headers:{'Content-Type':'application/x-www-form-urlencoded'}});el('signup-status').textContent=await response.text();if(response.ok)form.reset();}catch{el('signup-status').textContent='Signup could not be saved. You can still download without signing up.';}finally{button.disabled=false;}});
