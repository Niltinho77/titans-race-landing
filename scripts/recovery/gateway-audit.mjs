import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
const env=parseEnv(await readFile('.env','utf8'));
if (env.ASAAS_API_BASE_URL?.replace(/\/$/,'')!=='https://api.asaas.com/v3') throw new Error('Asaas de produção não configurado.');
const {audit}=JSON.parse(await readFile('.tmp/recovery/send-audit.json','utf8'));
const rows=[];
for (const person of audit) {
 const payments=new Map();
 for (const order of person.orders) {
  for (const query of [{externalReference:order.id},{checkoutSession:order.asaasCheckoutId}]) {
   let offset=0;
   while (true) {
    const url=new URL(env.ASAAS_API_BASE_URL+'/payments');
    url.search=new URLSearchParams({...query,limit:'100',offset:String(offset)}).toString();
    const response=await fetch(url,{headers:{access_token:env.ASAAS_API_KEY,'User-Agent':'TitansRace-Recovery-Audit'},signal:AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(`Asaas HTTP ${response.status}; consulta interrompida.`);
    const data=await response.json();
    if (!Array.isArray(data.data)) throw new Error('Formato Asaas inválido.');
    for(const payment of data.data) payments.set(payment.id,{id:payment.id,status:payment.status,deleted:payment.deleted,checkoutSession:payment.checkoutSession,externalReference:payment.externalReference});
    if(!data.hasMore)break;
    offset+=data.data.length;
    if(!data.data.length)throw new Error('Paginação inválida.');
   }
  }
 }
 const safe=[...payments.values()].every(p=>p.deleted===true||['CANCELED','CANCELLED','REFUSED','FAILED'].includes(p.status));
 rows.push({recipient:person.recipient,checkedAt:new Date().toISOString(),safe,payments:[...payments.values()]});
}
await writeFile('.tmp/recovery/gateway-audit.json',JSON.stringify(rows,null,2),{mode:0o600});
console.log(JSON.stringify(rows.map(r=>({recipient:r.recipient,safe:r.safe,paymentCount:r.payments.length,statuses:r.payments.map(p=>p.status)})),null,2));
