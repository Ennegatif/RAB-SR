/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Minus,
  Trash2, 
  Download, 
  PieChart as PieChartIcon, 
  List, 
  Calculator, 
  Briefcase,
  ChevronDown,
  ChevronRight,
  Info,
  Smartphone,
  Lock,
  Unlock,
  CheckCircle2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { RABItem, RABCategory, RABProject } from './types';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
const CAT_BG_COLORS = [
  'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  'bg-brand-success/10 text-brand-success border-brand-success/20',
  'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
  'bg-brand-info/10 text-brand-info border-brand-info/20'
];
const CAT_INDICATOR_COLORS = [
  'bg-brand-primary shadow-indigo-200',
  'bg-brand-success shadow-emerald-200',
  'bg-brand-warning shadow-amber-200',
  'bg-brand-info shadow-violet-200'
];

const INITIAL_PROJECT: RABProject = {
  id: 'project-1',
  title: 'SIMULASI RAB BIAYA SR',
  description: 'Simulasi rincian biaya pemasangan sambungan rumah (SR) baru berdasarkan standar operasional.',
  categories: [
    {
      id: 'cat-1',
      name: 'I. BIAYA UTAMA',
      items: [
        { id: 'item-1', description: 'BIAYA PENDAFTARAN', quantity: 1, unit: 'ls', unitPrice: 10000, totalPrice: 10000 },
        { id: 'item-2', description: 'BIAYA PEMASANGAN STANDART', quantity: 1, unit: 'ls', unitPrice: 1300000, totalPrice: 1300000 },
      ]
    },
    {
      id: 'cat-2',
      name: 'II. BIAYA TAMBAHAN',
      items: [
        { id: 'item-3', description: 'TAMBAHAN PIPA HDPE Ø ½', quantity: 0, unit: 'm', unitPrice: 18900, totalPrice: 0 },
        { id: 'item-4', description: 'BOR JACKING', quantity: 0, unit: 'm', unitPrice: 45000, totalPrice: 0 },
        { id: 'item-5', description: 'GALIAN BOR JACKING', quantity: 0, unit: 'ls', unitPrice: 156800, totalPrice: 0 },
        { id: 'item-6', description: 'PENGEMBALIAN CROSSING ASPAL', quantity: 0, unit: 'm', unitPrice: 29700, totalPrice: 0 },
        { id: 'item-7', description: 'PENGEMBALIAN RABATAN JALAN', quantity: 0, unit: 'm', unitPrice: 23700, totalPrice: 0 },
        { id: 'item-8', description: 'PENGEMBALIAN RABATAN HALAMAN', quantity: 0, unit: 'm', unitPrice: 14800, totalPrice: 0 },
        { id: 'item-9', description: 'PENGEMBALIAN PAVING', quantity: 0, unit: 'm', unitPrice: 7600, totalPrice: 0 },
      ]
    },
    {
      id: 'cat-3',
      name: 'III. BIAYA LAIN-LAIN',
      items: [
        { id: 'item-11', description: 'MATERAI 10000', quantity: 0, unit: 'bh', unitPrice: 12000, totalPrice: 0 },
      ]
    }
  ],
  taxRate: 0,
  discount: 0
};

export default function App() {
  const [project, setProject] = useState<RABProject>(INITIAL_PROJECT);
  const [activeTab, setActiveTab] = useState<'editor' | 'summary'>('editor');
  const [isPriceLocked, setIsPriceLocked] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const subTotal = useMemo(() => {
    return project.categories.reduce((total, cat) => {
      return total + cat.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }, 0);
  }, [project]);

  const grandTotal = subTotal;

  const chartData = useMemo(() => {
    return project.categories.map(cat => ({
      name: cat.name,
      value: cat.items.reduce((sum, item) => sum + item.totalPrice, 0)
    })).filter(d => d.value > 0);
  }, [project]);

  const addItem = (categoryId: string) => {
    const newItem: RABItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit: 'm',
      unitPrice: 0,
      totalPrice: 0
    };

    setProject(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
      )
    }));
  };

  const updateItem = (categoryId: string, itemId: string, updates: Partial<RABItem>) => {
    setProject(prev => {
      const updatedCategories = prev.categories.map(cat => {
        if (cat.id !== categoryId) return cat;

        const updatedItems = cat.items.map(item => {
          if (item.id === itemId) {
            const updatedItem = { ...item, ...updates };
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
            return updatedItem;
          }
          return item;
        });

        // Business Logic: If BOR JACKING > 0, ensure GALIAN BOR JACKING is 1, otherwise 0
        const borJacking = updatedItems.find(i => i.description === 'BOR JACKING');
        const galian = updatedItems.find(i => i.description === 'GALIAN BOR JACKING');

        if (borJacking && galian) {
          const targetQty = borJacking.quantity > 0 ? 1 : 0;
          if (galian.quantity !== targetQty) {
            return {
              ...cat,
              items: updatedItems.map(i => {
                if (i.id === galian.id) {
                  return { ...i, quantity: targetQty, totalPrice: targetQty * i.unitPrice };
                }
                return i;
              })
            };
          }
        }

        return { ...cat, items: updatedItems };
      });

      return { ...prev, categories: updatedCategories };
    });
  };

  const removeItem = (categoryId: string, itemId: string) => {
    setProject(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === categoryId 
          ? { ...cat, items: cat.items.filter(item => item.id !== itemId) } 
          : cat
      )
    }));
  };

  const addCategory = () => {
    const newCat: RABCategory = {
      id: `cat-${Date.now()}`,
      name: 'Kategori Baru',
      items: []
    };
    setProject(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));
  };

  const removeCategory = (id: string) => {
    setProject(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id)
    }));
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-primary selection:text-white pb-20 text-slate-800">
      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div className="bg-brand-primary text-white py-3 px-4 sm:py-4 sm:px-6 flex items-center justify-between shadow-2xl sticky top-0 z-[60] border-b border-white/10 animate-in fade-in slide-in-from-top duration-500 gap-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="bg-white/20 p-1.5 sm:p-2 rounded-xl shrink-0">
              <Smartphone size={windowWidth < 640 ? 16 : 20} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0 truncate">
              <span className="text-xs sm:text-sm font-black tracking-tight leading-none mb-0.5 sm:mb-1 truncate">Gunakan Sebagai Aplikasi HP</span>
              <span className="text-[8px] sm:text-[10px] text-indigo-100 font-medium opacity-80 uppercase tracking-widest truncate">Akses offline & icon layar utama</span>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="text-[10px] sm:text-xs font-black uppercase bg-white text-brand-primary px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            Instal
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-brand-surface border-b border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="bg-brand-primary p-2 sm:p-2.5 rounded-xl text-white shadow-indigo-200 shadow-lg flex-shrink-0">
              <Calculator size={windowWidth < 640 ? 20 : 24} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <input 
                type="text" 
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
                className="text-base sm:text-xl font-extrabold text-slate-800 bg-transparent border-none focus:ring-0 p-0 block leading-tight truncate w-full"
              />
              <input 
                type="text" 
                value={project.description}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
                className="text-[10px] sm:text-xs text-slate-400 font-medium bg-transparent border-none focus:ring-0 p-0 block truncate leading-none mt-0.5 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={() => setIsPriceLocked(!isPriceLocked)}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border shadow-sm shrink-0",
                isPriceLocked 
                  ? "bg-slate-900 text-white border-slate-900 shadow-slate-200" 
                  : "bg-white text-brand-primary border-slate-200 hover:border-brand-primary/50"
              )}
            >
              {isPriceLocked ? <Lock size={14} /> : <Unlock size={14} />}
              <span className="hidden min-[400px]:inline">{isPriceLocked ? 'Harga Terkunci' : 'Harga Terbuka'}</span>
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Terakhir</span>
              <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('id-ID')}</span>
            </div>
            <button 
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus semua data dan reset?')) {
                  setProject(INITIAL_PROJECT);
                }
              }}
              className="text-slate-400 hover:text-red-500 transition-colors p-2 shrink-0"
              title="Reset Data"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Quick Stats Grid */}
        <div className="mb-8 md:mb-12">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl text-white flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 left-0 w-80 h-80 bg-brand-primary opacity-20 rounded-full blur-[120px] -ml-20 -mt-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-brand-info opacity-10 rounded-full blur-[100px] -mr-10 -mb-10"></div>
            
            <div className="relative z-10 text-center md:text-left w-full md:w-auto">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Seluruh Biaya</span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-sm font-mono leading-none flex flex-wrap items-baseline justify-center md:justify-start gap-1 sm:gap-2">
                <span className="text-lg sm:text-2xl opacity-50">Rp.</span>
                <span className="truncate">{formatCurrency(grandTotal).replace('Rp. ', '')}</span>
              </h2>
            </div>

            <div className="relative z-10 hidden md:flex flex-col items-end gap-1 opacity-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Referensi Proyek</span>
              <p className="text-sm font-bold text-white uppercase tracking-wider">Sambungan Rumah (SR)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6 md:mb-10">
          <div className="flex p-1 bg-slate-200/50 rounded-2xl overflow-x-auto no-scrollbar touch-pan-x">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`flex-1 flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'editor' ? 'bg-white text-brand-primary shadow-md' : 'text-slate-500 hover:text-brand-primary'}`}
            >
              <List size={windowWidth < 640 ? 16 : 18} /> Editor Pekerjaan
            </button>
            <button 
              onClick={() => setActiveTab('summary')}
              className={`flex-1 flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'summary' ? 'bg-white text-brand-primary shadow-md' : 'text-slate-500 hover:text-brand-info'}`}
            >
              <PieChartIcon size={windowWidth < 640 ? 16 : 18} /> Rincian Budget
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-10">
          <div className="col-span-12 lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === 'editor' ? (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 md:space-y-8"
                >
                  {project.categories.map((category, catIdx) => (
                    <div key={category.id} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-5 md:p-8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-shadow duration-500">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 md:mb-8 gap-4">
                        <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                          <div className={cn(
                            "w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-base md:text-xl shadow-lg border shrink-0",
                            CAT_BG_COLORS[catIdx % CAT_BG_COLORS.length]
                          )}>
                            {catIdx + 1}
                          </div>
                          <input 
                            type="text"
                            value={category.name}
                            onChange={(e) => setProject(prev => ({
                              ...prev,
                              categories: prev.categories.map(c => c.id === category.id ? { ...c, name: e.target.value } : c)
                            }))}
                            className={cn(
                              "bg-transparent border-none focus:ring-0 p-0 text-lg md:text-2xl font-black w-full min-w-0 truncate",
                              catIdx === 0 ? "text-brand-primary" : 
                              catIdx === 1 ? "text-brand-success" : 
                              catIdx === 2 ? "text-brand-warning" : "text-brand-info"
                            )}
                          />
                        </div>
                        <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                           <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:mb-1 italic">Total Seksi</span>
                             <span className="text-base md:text-xl font-black text-slate-800">
                               Rp. {formatCurrency(category.items.reduce((s, i) => s + i.totalPrice, 0))}
                             </span>
                           </div>
                        </div>
                      </div>

                      {/* Mobile View: Stacked Cards */}
                      <div className="md:hidden space-y-4">
                        <div className={cn(
                          "h-1 w-full rounded-full mb-4 opacity-30",
                          CAT_INDICATOR_COLORS[catIdx % CAT_INDICATOR_COLORS.length].split(' ')[0]
                        )} />
                        {category.items.map((item) => (
                           <div key={item.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{catIdx === 0 ? "ADMINISTRASI" : catIdx === 1 ? "PEKERJAAN" : catIdx === 2 ? "PEMBELIAN" : "Komponen Pekerjaan"}</span>
                                <input 
                                  type="text"
                                  value={item.description}
                                  readOnly={true}
                                  onChange={(e) => updateItem(category.id, item.id, { description: e.target.value })}
                                  className="w-full bg-slate-50/50 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 shadow-sm border-none focus:ring-0 cursor-default"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Volume & Sat</span>
                                  <div className="flex bg-white rounded-xl shadow-sm overflow-hidden items-center border border-slate-100/50 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
                                    {(() => {
                                      const isGalian = item.description === 'GALIAN BOR JACKING';
                                      const borJacking = category.items.find(i => i.description === 'BOR JACKING');
                                      const isLocked = (isGalian && borJacking) || catIdx === 0;
                                      return (
                                        <>
                                          <button 
                                            onClick={() => updateItem(category.id, item.id, { quantity: Math.max(0, item.quantity - 1) })}
                                            disabled={isLocked}
                                            className="px-2 py-2 text-slate-400 hover:text-brand-primary disabled:opacity-30 transition-colors bg-slate-50/50"
                                            tabIndex={-1}
                                          >
                                            <Minus size={14} />
                                          </button>
                                          <input 
                                            type="number" 
                                            value={item.quantity}
                                            disabled={isLocked}
                                            onChange={(e) => updateItem(category.id, item.id, { quantity: Number(e.target.value) })}
                                            className={cn(
                                              "w-full px-1 py-2 text-sm text-center font-black focus:ring-0 border-none",
                                              isLocked && "text-slate-400 bg-slate-100 italic"
                                            )}
                                          />
                                          <button 
                                            onClick={() => updateItem(category.id, item.id, { quantity: item.quantity + 1 })}
                                            disabled={isLocked}
                                            className="px-2 py-2 text-slate-400 hover:text-brand-primary disabled:opacity-30 transition-colors bg-slate-50/50"
                                            tabIndex={-1}
                                          >
                                            <Plus size={14} />
                                          </button>
                                        </>
                                      );
                                    })()}
                                    <input 
                                      type="text"
                                      value={item.unit}
                                      readOnly={true}
                                      onChange={(e) => updateItem(category.id, item.id, { unit: e.target.value })}
                                      className="w-12 h-full bg-slate-50 text-[10px] font-black text-center text-slate-500 uppercase border-l border-slate-100 focus:ring-0 cursor-default"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Harga Satuan</span>
                                  <input 
                                    type="number"
                                    value={item.unitPrice}
                                    readOnly={isPriceLocked}
                                    onChange={(e) => updateItem(category.id, item.id, { unitPrice: Number(e.target.value) })}
                                    className={cn(
                                      "w-full bg-white rounded-xl px-3 py-2 text-sm font-black shadow-sm border-none transition-all",
                                      isPriceLocked ? "cursor-not-allowed opacity-70 bg-slate-100" : "focus:ring-2 focus:ring-brand-primary"
                                    )}
                                  />
                                </div>
                              </div>

                              <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Biaya</span>
                                <span className={cn(
                                  "px-4 py-2 rounded-xl font-black text-sm",
                                  catIdx === 0 ? "bg-brand-primary/10 text-brand-primary" : 
                                  catIdx === 1 ? "bg-brand-success/10 text-brand-success" : 
                                  catIdx === 2 ? "bg-brand-warning/10 text-brand-warning" : "bg-brand-info/10 text-brand-info"
                                )}>
                                  Rp. {formatCurrency(item.totalPrice)}
                                </span>
                              </div>
                           </div>
                        ))}
                      </div>

                      {/* Desktop View: Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <div className="min-w-full">
                          <div className={cn(
                            "h-1 w-full rounded-full mb-6 opacity-30",
                            CAT_INDICATOR_COLORS[catIdx % CAT_INDICATOR_COLORS.length].split(' ')[0]
                          )} />
                          <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-50">
                              <th className="pb-4 text-left font-black w-[40%]">{catIdx === 0 ? "ADMINISTRASI" : catIdx === 1 ? "PEKERJAAN" : catIdx === 2 ? "PEMBELIAN" : "Komponen Pekerjaan"}</th>
                              <th className="pb-4 text-center font-black">Volume</th>
                              <th className="pb-4 text-center font-black">Unit</th>
                              <th className="pb-4 text-right font-black w-32">Harga</th>
                              <th className="pb-4 text-right font-black w-32 pr-4">Total</th>
                              <th className="pb-4 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {category.items.map((item) => (
                              <tr key={item.id} className="group transition-colors">
                                <td className="py-5 pr-4">
                                  <input 
                                    type="text"
                                    value={item.description}
                                    readOnly={true}
                                    onChange={(e) => updateItem(category.id, item.id, { description: e.target.value })}
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-slate-700 placeholder:text-slate-300 cursor-default"
                                    placeholder={catIdx === 0 ? "ADMINISTRASI" : catIdx === 1 ? "PEKERJAAN" : catIdx === 2 ? "PEMBELIAN" : "Komponen Pekerjaan"}
                                  />
                                </td>
                                <td className="py-5 text-center">
                                  <div className="flex bg-slate-50 rounded-xl overflow-hidden items-center focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-primary w-[120px] mx-auto border border-slate-100/50 shadow-inner">
                                    {(() => {
                                      const isGalian = item.description === 'GALIAN BOR JACKING';
                                      const borJacking = category.items.find(i => i.description === 'BOR JACKING');
                                      const isLocked = (isGalian && borJacking) || catIdx === 0;
                                      
                                      return (
                                        <>
                                          <button 
                                            onClick={() => updateItem(category.id, item.id, { quantity: Math.max(0, item.quantity - 1) })}
                                            disabled={isLocked}
                                            className="px-2 py-2 text-slate-400 hover:text-brand-primary hover:bg-slate-100 disabled:opacity-30 transition-colors"
                                            tabIndex={-1}
                                          >
                                            <Minus size={14} />
                                          </button>
                                          <input 
                                            type="number" 
                                            value={item.quantity}
                                            disabled={isLocked}
                                            onChange={(e) => updateItem(category.id, item.id, { quantity: Number(e.target.value) })}
                                            className={cn(
                                              "w-full px-1 py-2 text-sm text-center font-black focus:ring-0 border-none bg-transparent",
                                              isLocked && "text-slate-400 cursor-not-allowed"
                                            )}
                                          />
                                          <button 
                                            onClick={() => updateItem(category.id, item.id, { quantity: item.quantity + 1 })}
                                            disabled={isLocked}
                                            className="px-2 py-2 text-slate-400 hover:text-brand-primary hover:bg-slate-100 disabled:opacity-30 transition-colors"
                                            tabIndex={-1}
                                          >
                                            <Plus size={14} />
                                          </button>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className="py-5">
                                  <input 
                                    type="text"
                                    value={item.unit}
                                    readOnly={true}
                                    onChange={(e) => updateItem(category.id, item.id, { unit: e.target.value })}
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-center text-slate-400 uppercase cursor-default"
                                    placeholder="Sat"
                                  />
                                </td>
                                <td className="py-5">
                                  <input 
                                    type="number"
                                    value={item.unitPrice}
                                    readOnly={isPriceLocked}
                                    onChange={(e) => updateItem(category.id, item.id, { unitPrice: Number(e.target.value) })}
                                    className={cn(
                                      "w-32 ml-auto bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-right font-black transition-all shadow-inner block",
                                      isPriceLocked ? "cursor-not-allowed opacity-70" : "focus:bg-white focus:ring-2",
                                      !isPriceLocked && (
                                        catIdx === 0 ? "focus:ring-brand-primary/30 text-brand-primary" : 
                                        catIdx === 1 ? "focus:ring-brand-success/30 text-brand-success" : 
                                        catIdx === 2 ? "focus:ring-brand-warning/30 text-brand-warning" : "focus:ring-brand-info/30 text-brand-info"
                                      )
                                    )}
                                  />
                                </td>
                                <td className="py-5 pr-4">
                                  <div className="flex justify-end">
                                    <span className={cn(
                                      "w-32 px-3 py-2.5 rounded-xl text-right font-black text-sm block",
                                      catIdx === 0 ? "bg-brand-primary/5 text-brand-primary" : 
                                      catIdx === 1 ? "bg-brand-success/5 text-brand-success" : 
                                      catIdx === 2 ? "bg-brand-warning/5 text-brand-warning" : "bg-brand-info/5 text-brand-info"
                                    )}>
                                      {formatCurrency(item.totalPrice)}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Selected Items Summary */}
                {(() => {
                  const selectedItems = project.categories.flatMap((cat, catIdx) => 
                    cat.items.filter(item => item.quantity > 0).map(item => ({
                      ...item, 
                      categoryName: cat.name,
                      categoryIndex: catIdx
                    }))
                  );
                  
                  if (selectedItems.length === 0) return null;

                  return (
                    <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 mt-10 w-full mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                      
                      <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="bg-brand-success/10 p-2.5 rounded-xl text-brand-success shadow-sm">
                          <CheckCircle2 size={20} />
                        </div>
                        <h4 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-widest">
                          Ringkasan Biaya
                        </h4>
                      </div>

                      <div className="space-y-3 relative z-10">
                        {selectedItems.map((item, idx) => (
                          <div key={`${item.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl md:rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-100/50 hover:border-slate-200 shadow-sm">
                            <div className="flex items-start gap-4">
                              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-500 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-bold text-slate-700">{item.description}</span>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate max-w-[150px] sm:max-w-none px-2 py-0.5 bg-slate-200/50 rounded flex items-center">{item.categoryName}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                  <span className="uppercase tracking-wider">{item.quantity} {item.unit} &times; Rp. {formatCurrency(item.unitPrice).replace('Rp. ', '')}</span>
                                </span>
                              </div>
                            </div>
                            <div className="text-left sm:text-right flex items-center sm:block pl-11 sm:pl-0">
                               <span className="text-sm font-black text-brand-primary bg-brand-primary/5 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg whitespace-nowrap">
                                 Rp. {formatCurrency(item.totalPrice).replace('Rp. ', '')}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Editor Grand Total Section */}
                <div className="bg-brand-primary rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(99,102,241,0.2)] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-white/10 mt-10 w-full mb-8">
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl saturate-200" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-info opacity-20 rounded-full blur-3xl saturate-200" />
                  
                  <div className="relative z-10 flex flex-col items-center md:items-start w-full md:w-auto">
                    <span className="text-[10px] sm:text-xs font-black text-indigo-200 uppercase tracking-[0.3em] mb-2 text-center md:text-left drop-shadow-sm">Total Seluruh Biaya</span>
                    <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-mono flex items-baseline justify-center md:justify-start gap-2 drop-shadow-md">
                      <span className="text-lg sm:text-2xl opacity-60">Rp.</span>
                      {formatCurrency(grandTotal).replace('Rp. ', '')}
                    </h3>
                  </div>

                  <div className="relative z-10 bg-white/10 rounded-2xl p-4 sm:p-5 w-full md:w-auto min-w-[200px] border border-white/10 backdrop-blur-md hidden sm:block">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Subtotal</span>
                       <span className="text-sm font-black text-white">Rp. {formatCurrency(subTotal).replace('Rp. ', '')}</span>
                    </div>
                    <div className="flex justify-between items-center mb-0 opacity-50">
                       <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Pajak / Diskon</span>
                       <span className="text-sm font-black text-white">Rp. 0</span>
                    </div>
                  </div>
                </div>

                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 border border-slate-100 shadow-sm overflow-hidden"
                >
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 text-center mb-8 md:mb-10">Penyebaran Anggaran</h3>
                  
                  <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
                    <div className="w-full h-[280px] sm:h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={windowWidth < 640 ? 65 : 90}
                            outerRadius={windowWidth < 640 ? 95 : 130}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                             contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '15px' }}
                             formatter={(value: number) => `Rp. ${formatCurrency(value)}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      {chartData.map((cat, idx) => (
                        <div key={idx} className="p-4 md:p-5 rounded-2xl bg-brand-bg border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{cat.name}</span>
                             </div>
                             <span className="text-[10px] font-black text-slate-800 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">{subTotal > 0 ? ((cat.value/subTotal)*100).toFixed(1) : 0}%</span>
                          </div>
                          <p className="text-lg md:text-xl font-black text-slate-900 leading-tight">Rp. {formatCurrency(cat.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="col-span-12 lg:col-span-4 self-start space-y-6 md:space-y-8">
            <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
               <div className="absolute top-0 right-0 w-48 h-48 bg-brand-secondary opacity-10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-success opacity-5 rounded-full blur-[60px] -ml-10 -mb-10"></div>
               <div className="relative z-10">
                 <h3 className="text-lg md:text-xl font-black mb-6 md:mb-10 flex items-center gap-3">
                   <Briefcase size={24} className="text-brand-secondary" /> Info Pemasangan
                 </h3>
                 <div className="space-y-4 md:space-y-6">
                    <div className="p-4 md:p-5 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 italic">Standard Operational Procedure</p>
                      <p className="text-xs md:text-[13px] leading-relaxed text-slate-300">
                        Aplikasi Ini Sebagai Estimasi Dan Simulasi Untuk Memudakan Perhitungan Biaya Di Lapangan Dan Untuk Lebih Akuratnya Bisa Langsung Cek Di CETET.
                      </p>
                    </div>
                    <div className="flex items-start md:items-center gap-4 p-4 md:p-5 bg-brand-primary/10 rounded-2xl">
                      <div className="text-brand-secondary shrink-0">
                        <Info size={20} />
                      </div
                    </div>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-8 md:p-10 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-md md:text-lg font-black text-slate-800 mb-4 md:mb-6 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-primary" />
                  Memo Proyek
                </h3>
                <textarea 
                  className="w-full min-h-[120px] md:min-h-[160px] bg-slate-50 rounded-2xl p-5 md:p-6 text-sm font-medium text-slate-700 border-none focus:ring-2 focus:ring-brand-primary/20 placeholder:text-slate-300 transition-all resize-none shadow-inner"
                  placeholder="Ketik rincian teknis atau catatan di sini..."
                ></textarea>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 text-center opacity-30">
        <p className="text-xs font-black text-slate-900 uppercase tracking-[0.6em]">SIMULASI RAB SR • ARCHITECTURAL FINANCE</p>
      </footer>
    </div>
  );
}
