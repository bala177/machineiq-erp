import { Suspense } from 'react';
import { SalesWorkspace } from '@/components/sales/sales-workspace';
export default function SalesPage(){return <Suspense fallback={<p>Loading sales…</p>}><SalesWorkspace/></Suspense>;}
