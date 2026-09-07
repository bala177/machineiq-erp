import { BadRequestException } from '@nestjs/common';
import { SalesLineDto } from './sales.dto';

// Fixed-point decimal arithmetic. Quantities/rates retain six decimals; currency
// rounding is half-up per line. No binary floating-point arithmetic in totals.
const SCALE = 1000000n;
export function fixed(value: number | string): bigint {
  const text = String(value);
  if (!/^\d+(\.\d{1,6})?$/.test(text)) throw new BadRequestException('Use a nonnegative decimal with at most six places');
  const [whole, decimal=''] = text.split('.');
  return BigInt(whole)*SCALE+BigInt(decimal.padEnd(6,'0'));
}
const rounded = (n: bigint,d: bigint) => (n+d/2n)/d;
export function moneyString(units: bigint, precision: number) {
  const s=units.toString().padStart(precision+1,'0');
  return precision ? s.slice(0,-precision)+'.'+s.slice(-precision) : s;
}
export function amountUnits(value:number|string, precision:number) {
  const raw=fixed(value), divisor=10n**BigInt(6-precision);
  if(raw%divisor) throw new BadRequestException(`Amounts must use at most ${precision} decimal places`);
  return raw/divisor;
}
export function salesTotals(lines: SalesLineDto[], precision:number) {
  if(!Number.isInteger(precision)||precision<0||precision>4) throw new BadRequestException('Invalid currency precision');
  let net=0n,tax=0n;const unit=10n**BigInt(precision);
  const result=lines.map(line=>{
    const qty=fixed(line.quantity),price=fixed(line.unit_price),discount=fixed(line.discount_percent),rate=fixed(line.tax_percent);
    if(!qty||discount>100n*SCALE||rate>100n*SCALE) throw new BadRequestException('Invalid line quantity or percentage');
    const n=rounded(qty*price*(100n*SCALE-discount)*unit,SCALE*SCALE*100n*SCALE);
    const t=rounded(n*rate,100n*SCALE);net+=n;tax+=t;
    return {...line,net:moneyString(n,precision),tax:moneyString(t,precision),gross:moneyString(n+t,precision)};
  });
  return {lines:result,net:moneyString(net,precision),tax:moneyString(tax,precision),gross:moneyString(net+tax,precision)};
}
