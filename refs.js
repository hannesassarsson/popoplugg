/* Lagrum: hittar paragrafhänvisningar i text och bygger länkar till lagen.nu */
(function(){
const SFS={BrB:["1962:700","brottsbalken"],RB:["1942:740","rättegångsbalken"],RF:["1974:152","regeringsformen"],OL:["1993:1617","ordningslagen"],FL:["2017:900","förvaltningslagen"],PL:["1984:387","polislagen"],LOB:["1976:511","LOB"],KL:["1988:254","knivlagen"],HL:["2010:611","häkteslagen"],EKMR:["1994:1219","Europakonventionen"],VL:["1996:67","vapenlagen"]};
function norm(law,kap,par){return {law,kap:kap||"",par:par||""}}
function find(text){
  const out=[];if(!text)return out;let m;
  const re1=/\b(BrB|RB|RF|OL|FL) (\d+) kap\.(?: (\d+(?: [a-c])?)(?:–\d+)? §§?)?/g;
  while((m=re1.exec(text)))out.push(norm(m[1],m[2],m[3]));
  const re2=/\b(PL|LOB) (\d+(?: [a-c])?) §/g;
  while((m=re2.exec(text)))out.push(norm(m[1],"",m[2]));
  const re3=/\b(\d+(?: [a-c])?) § (polislagen|PL)\b/g;
  while((m=re3.exec(text)))out.push(norm("PL","",m[1]));
  const re4=/Knivlagen (\d+) §/g;
  while((m=re4.exec(text)))out.push(norm("KL","",m[1]));
  const re5=/EKMR art\. (\d+)|[Aa]rtikel (\d+)/g;
  while((m=re5.exec(text)))out.push(norm("EKMR","",""));
  if(/Lag 1988:254|knivlagen/i.test(text)&&!out.some(r=>r.law==="KL"))out.push(norm("KL","",""));
  if(/Lag 2010:611/.test(text))out.push(norm("HL","",""));
  if(/vapenlagen/i.test(text))out.push(norm("VL","",""));
  if(/\bLOB\b/.test(text)&&!out.some(r=>r.law==="LOB"))out.push(norm("LOB","",""));
  if(/\bRB 28 kap\.|rättegångsbalken 28 kap\./.test(text)&&!out.some(r=>r.law==="RB"))out.push(norm("RB","28",""));
  const seen=new Set();return out.filter(r=>{const k=r.law+r.kap+r.par;if(seen.has(k))return false;seen.add(k);return true});
}
function url(r){
  const p=r.par.replace(" ","");
  const a=r.kap&&p?`#K${r.kap}P${p}`:r.kap?`#K${r.kap}`:p?`#P${p}`:"";
  return `https://lagen.nu/${SFS[r.law][0]}${a}`;
}
function label(r){
  const name=SFS[r.law][1];
  if(r.kap&&r.par)return `${name} ${r.kap} kap. ${r.par} §`;
  if(r.kap)return `${name} ${r.kap} kap.`;
  if(r.par)return `${r.par} § ${name}`;
  return name;
}
window.PP_REF={find,url,label,SFS};
})();
