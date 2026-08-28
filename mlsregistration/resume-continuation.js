let registrationResumeState=null;
export async function initRegistrationResume(form,options={}){
  const u=new URL(location.href),token=u.searchParams.get("resume");if(!token)return null;
  const test=u.searchParams.get("resumeTest")==="1";
  const r=await fetch("/api/resume/context",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({resumeToken:token})});
  const out=await r.json().catch(()=>null);if(!r.ok||!out?.ok||!out.context)throw new Error(out?.error||"Unable to load the saved registration.");
  registrationResumeState={token,testMode:Boolean(test||out.context.resume?.testMode),context:out.context};
  if(form)applyResumeContextToNamedFields(form,out.context);
  if(registrationResumeState.testMode)showResumeTestBanner();
  if(typeof options.onLoaded==="function")options.onLoaded(registrationResumeState);
  return registrationResumeState;
}
export function getRegistrationResumeState(){return registrationResumeState;}
export async function completeRegistrationResume(registrationSubmissionId){
  if(!registrationResumeState?.token)return {ok:true,skipped:true};
  if(registrationResumeState.testMode)return {ok:true,testMode:true,skipped:true};
  const r=await fetch("/api/resume/complete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({resumeToken:registrationResumeState.token,registrationSubmissionId})});
  const out=await r.json().catch(()=>null);if(!r.ok||!out?.ok)throw new Error(out?.error||"Registration was saved, but duplicate reconciliation could not be finalized.");return out;
}
export function applyResumeContextToNamedFields(form,c){
  if(!form||!c)return;
  const set=(n,v)=>{const el=form.elements.namedItem(n);if(!el||v===undefined||v===null)return;if(el instanceof RadioNodeList){Array.from(el).forEach(x=>{if(x instanceof HTMLInputElement&&x.type==="radio")x.checked=String(x.value)===String(v);});return;}if(el instanceof HTMLInputElement&&el.type==="checkbox"){el.checked=/^(yes|true|1|agree)$/i.test(String(v));return;}el.value=String(v);el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));};
  const p=c.parent||{};set("parentFirstName",p.firstName);set("parentLastName",p.lastName);set("parentEmail",p.email);set("parentPhone",p.phone);set("parentStreet",p.street);set("parentApt",p.apt);set("parentCity",p.city);set("parentState",p.state);set("parentZip",p.zip);set("parentGuardianDob",p.dob);
  const e=c.emergency||{};set("emergencySameAsParent",e.sameAsParent);set("emergencyFirstName",e.firstName);set("emergencyLastName",e.lastName);set("emergencyRelationship",e.relationship);set("emergencyEmail",e.email);set("emergencyPhone",e.phone);set("emergencyStreet",e.street);set("emergencyApt",e.apt);set("emergencyCity",e.city);set("emergencyState",e.state);set("emergencyZip",e.zip);
  (c.players||[]).forEach((p,z)=>{const i=z+1;set(`p${i}FirstName`,p.firstName);set(`p${i}LastName`,p.lastName);set(`p${i}Dob`,p.dob);set(`p${i}Gender`,p.gender);set(`p${i}Grade`,p.grade);set(`p${i}Jersey`,p.jersey);set(`p${i}Shorts`,p.shorts);set(`p${i}Socks`,p.socks);set(`p${i}Race`,p.race);set(`p${i}RaceOther`,p.raceOther);set(`p${i}FavoriteClub`,p.favoriteClub);set(`p${i}HearAbout`,p.hearAbout);});
  set("helpChoice",c.helpChoice);set("scholarshipRequested",c.scholarshipRequested);
}
function showResumeTestBanner(){if(document.getElementById("resume-test-banner"))return;const b=document.createElement("div");b.id="resume-test-banner";b.textContent="TEST CONTINUATION — this session must not update live registration data.";Object.assign(b.style,{position:"sticky",top:"0",zIndex:"9999",padding:"10px 14px",background:"#fff3cd",color:"#664d03",fontWeight:"700",textAlign:"center"});document.body.prepend(b);}