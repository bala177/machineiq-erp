'use client';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { SalesWorkspace } from '@/components/sales/sales-workspace';
export default function SalesDetailPage(){const {id}=useParams<{id:string}>();return <Suspense fallback={<p>Loading document…</p>}><SalesWorkspace id={id}/></Suspense>;}
