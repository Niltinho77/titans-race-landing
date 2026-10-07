import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { selectCandidates } from './select-candidates.mjs';
const require=createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
try {
 const audience=JSON.parse(await readFile('.tmp/recovery/preview-2026-09-05T00-39-18-984Z.json','utf8'));
 const orders=await db.order.findMany({select:{id:true,modalityId:true,status:true,createdAt:true,updatedAt:true,paidAt:true,confirmationEmailSentAt:true,mpPaymentStatus:true,asaasPaymentStatus:true,pagbankPaymentStatus:true,mpPreferenceId:true,mpPaymentId:true,asaasCheckoutId:true,asaasPaymentId:true,asaasCustomerId:true,stripeSessionId:true,pagbankCheckoutId:true,participants:{select:{fullName:true,cpf:true,email:true,phone:true,bibNumber:true}}}});
 const current=selectCandidates(orders).candidates;
 const selected=audience.candidates.map(c=>({original:c,current:current.find(n=>n.email===c.email&&n.relatedOrderIds.includes(c.orderId))}));
 const audit=selected.map(({original,current},i)=>({recipient:i+1,eligible:!!current,orders:orders.filter(o=>(current?.relatedOrderIds??original.relatedOrderIds).includes(o.id)).map(o=>({id:o.id,status:o.status,createdAt:o.createdAt,mpPreferenceId:o.mpPreferenceId,mpPaymentId:o.mpPaymentId,asaasCheckoutId:o.asaasCheckoutId,asaasPaymentId:o.asaasPaymentId,asaasCustomerId:o.asaasCustomerId,stripeSessionId:o.stripeSessionId,pagbankCheckoutId:o.pagbankCheckoutId,asaasPaymentStatus:o.asaasPaymentStatus,mpPaymentStatus:o.mpPaymentStatus,participantCount:o.participants.length}))}));
 await writeFile('.tmp/recovery/send-audit.json',JSON.stringify({selected,audit},null,2),{mode:0o600});
 console.log(JSON.stringify({asaasBase:process.env.ASAAS_API_BASE_URL,siteUrl:process.env.NEXT_PUBLIC_APP_URL||process.env.NEXT_PUBLIC_SITE_URL,configured:{resend:!!process.env.RESEND_API_KEY,from:!!process.env.RESEND_FROM,asaas:!!process.env.ASAAS_API_KEY,mp:!!process.env.MP_ACCESS_TOKEN},audit},null,2));
} finally {await db.$disconnect()}
