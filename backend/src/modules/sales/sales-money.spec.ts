import { amountUnits, salesTotals } from './sales-money';
const line=(quantity:number,unit_price:number,tax_percent=0,discount_percent=0)=>({description:'Machine',unit:'Nos',quantity,unit_price,tax_percent,discount_percent});
describe('R2 commercial precision',()=>{
  it('rounds decimals per line without binary floating point drift',()=>expect(salesTotals([line(1,1.005),line(1,2.675)],2)).toMatchObject({net:'3.69',tax:'0.00',gross:'3.69'}));
  it('retains fractional quantities and rounds tax on discounted net',()=>expect(salesTotals([line(0.125,100,18,10)],2)).toMatchObject({net:'11.25',tax:'2.03',gross:'13.28'}));
  it('supports zero and three decimal currencies',()=>{expect(salesTotals([line(1,10.5)],0).gross).toBe('11');expect(salesTotals([line(1,1.2345)],3).gross).toBe('1.235');});
  it('rejects over-precision milestone amounts and invalid quantities',()=>{expect(()=>amountUnits('1.001',2)).toThrow();expect(()=>salesTotals([line(0,100)],2)).toThrow();expect(()=>salesTotals([line(1,100,101)],2)).toThrow();});
});
