import { createDraftEnvelope, parseDraft, loadDraft, deleteDraft } from '../../src/lib/belge-draft-storage';
import { DOCUMENT_EDITABLE_FIELDS } from '../../src/lib/document-field-contracts';
import { loadCollapsedSections } from '../../src/lib/belge-section-preferences';
import { writeFileSync } from 'node:fs';

const id = 'beton-dokum-tutanagi';
const values = Object.fromEntries(DOCUMENT_EDITABLE_FIELDS[id].map(k=>[k,'AUDIT']));
const result = createDraftEnvelope({documentId:id,values,writerId:'audit',revision:1});
if(!result.ok) throw new Error('Invalid fixture');
const envelope = result.envelope;
const large = JSON.stringify({...envelope,values:{...values,yer:'x'.repeat(70000)}});
const storage = {getItem:()=>large,setItem:()=>{},removeItem:()=>{}};
const inherited = Object.create(envelope);
const forbidden = JSON.parse(JSON.stringify(envelope).replace('{','{"__proto__":{"audit":true},'));
const checks = [
  {id:'S01_oversize_read',result:loadDraft(storage,'device',id).ok?'FAIL':'PASS',bytes:Buffer.byteLength(large)},
  {id:'S02_inherited_envelope',result:parseDraft(inherited,id).ok?'FAIL':'PASS'},
  {id:'S03_forbidden_envelope_key',result:parseDraft(forbidden,id).ok?'FAIL':'PASS',note:'Accepted top-level key; this alone does not demonstrate exploitable prototype pollution.'},
  {id:'S04_unknown_section_id',result:loadCollapsedSections({...storage,getItem:()=>JSON.stringify(['not-a-real-section'])},id).size===0?'PASS':'FAIL'},
  {id:'S05_delete_unverified',result:deleteDraft({...storage,getItem:()=>{throw new Error('AUDIT read denied');}},'device',id).ok?'FAIL':'PASS'},
];
writeFileSync('docs/belgeler-ux-v3-denetim-2026-10-23/storage-results.json',JSON.stringify(checks,null,2));
for(const check of checks) console.log(JSON.stringify(check));
process.exitCode=checks.some(c=>c.result==='FAIL')?1:0;
