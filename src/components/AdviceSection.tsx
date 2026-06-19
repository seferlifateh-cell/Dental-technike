/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Cpu, BellRing, Eye, ShieldCheck, Pocket, Camera } from 'lucide-react';

export default function AdviceSection() {
  const recommendations = [
    {
      icon: <Cpu className="text-teal-400" size={20} />,
      title: "Masaüstü Texnologiyası: Tauri (Rust) və ya Electron",
      description: "Həkimlər və texniklər üçün yerli şəbəkədə sürətli və minimal RAM istifadəsi önəmlidir. Tauri həm proqramın ölçüsünü kiçik saxlayır (cəmi 10-15MB), həm də Rust arxası ilə yerli verilənlər bazasına yüksək təhlükəsizliklə yazmaq imkanı verir.",
      details: ["Minimal RAM istehlakı", "Kiçik quraşdırma faylı (installer)", "Auto-update və təhlükəsiz sandbox"]
    },
    {
      icon: <Pocket className="text-blue-400" size={20} />,
      title: "Yerli SQLite Cache və Offline Rejim",
      description: "Diş klinikasında internet kəsildiyi təqdirdə, həkimlərin işi dursa, bu, böyük maliyyə itkisidir. Sistem offline-first olaraq qurulmalı və yerli SQLite-a yazılmalıdır. İnternet bərpa olunanda, bulud verilənlər bazası (məs. PostgreSQL ssenarisi) ilə avtomatik sinxronizasiya edilməlidir.",
      details: ["Saniyəlik offline işləmə zəmanəti", "Rezerv kopyalama (Mütəmadi backup)", "Bulud sinxronizasiyası"]
    },
    {
      icon: <BellRing className="text-amber-400" size={20} />,
      title: "Gecikən və ya Çatışmayan İşlərin İdarə Edilməsi",
      description: "Xüsusilə diş texnikləri üçün vaxtında çatdırılma hər şeydir. Bizim tətbiqdəki kimi '!' işarəsi və daxili xatırlatma siqnalları ilə yanaşı, əgər proqram bağlıdırsa belə, sistemin fonda işçi (Background Service / Cron) vasitəsilə qeydçiyə vaxtında bildiriş ötürməsi təmin edilməlidir.",
      details: ["Native Desktop push notification inteqrasiyası", "Overdue (vaxtı keçmiş) olduqda vizual flaş işıqlandırması", "Sifarişçi həkimə avtomatik SMS/WhatsApp status mesajı"]
    },
    {
      icon: <Camera className="text-pink-400" size={20} />,
      title: "Klinika Kamera API və Rəng Tənzimlənməsi (Veneer/Crown)",
      description: "Estetik ortopediyada ən böyük problem diş rənglərinin (məsələn: A1, A2, BL1) həkim tərəfindən səhv daxil edilməsi və ya texnikin bunu fərqli görməsidir. Masaüstü tətbiqin daxili kamera API-si vasitəsilə kliniki daxili mikroskop və ya intraoral kameradan fotoşəkilləri birbaşa iş tərkibinə kəş etmək gücü olmalıdır.",
      details: ["Intraoral kamera görüntülərinin birbaşa yüklənməsi", "Diş rəng kodlarının (VITA Classic) avtomatik təhlili", "Fotoların üzərində texnik üçün qeydlərin çəkilməsi (annotation)"]
    },
    {
      icon: <Eye className="text-indigo-400" size={20} />,
      title: "Vizual İşarələr (+, -, /) və Təqvim Rahatlığı",
      description: "Həkim bir baxışda hansı klinikanın və ya xəstənin borclu olduğunu təhlil edə bilməlidir. +, -, / işarələri rəng koordinasiyası ilə birləşdirildikdə və təqvim üzərində daxil ediləndə UX sürətini 40% artırır.",
      details: ["Yaşıl (+) ilə tam ödəniş, Qırmızı (-) ilə heç ödənilməyən işlər", "Sarı-narıncı (/) ilə qismən (hissəli) beh qəbulu", "Təqvim günü üzərinə sürətli kliklə gəlir/xərc əlavə imkanı"]
    },
    {
      icon: <ShieldCheck className="text-emerald-400" size={20} />,
      title: "Məlumat Təhlükəsizliyi (HIPAA və GDPR uyğunluğu)",
      description: "Pasiyentlərin tibbi məlumatları və maliyyə qeydləri yüksək dərəcəli konfidensiallıq tələb edir. Masaüstü proqram daxili fərdi məlumatları lokal şifrələmə ilə (məsələn, SQLCipher) saxlamalı, giriş üçün isə PIN-Kod və ya Biometrik (Windows Hello / Touch ID) dəstəkləməlidir.",
      details: ["Pasiyent adlarının və diaqnozların şifrələnməsi", "Giriş loqlarının (Audit trail) saxlanılması", "Rol bazlı icazələr (Mühasib fərqli, Texnik fərqli ekran)"]
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6" id="ux-advice-section">
      <div className="mb-6">
        <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
          <Sparkles className="text-teal-400" size={20} />
          UI/UX və Sistem Təkmilləşdirmə Tövsiyələri
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Masaüstü (desktop) tətbiqinin həkimlər və texniklər tərəfindən gündəlik iş zamanı maksimum səmərəli və sürətli istifadəsi üçün əsas dizayn və memarlıq normaları.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec, index) => (
          <div key={index} className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/65 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0">
                {rec.icon}
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">{rec.title}</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {rec.description}
            </p>

            <div className="space-y-1.5 border-t border-slate-900 pt-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">UX Faydaları və Texniki Həll:</span>
              <ul className="grid grid-cols-1 gap-1">
                {rec.details.map((detail, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-teal-500 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-teal-950/20 to-blue-950/20 border border-teal-900/40 text-center">
        <p className="text-xs text-slate-300">
          💡 <strong>Professional məsləhət:</strong> Tibb sektorunda sadəlik vacibdir. Həkimlər gün ərzində əlcəklərlə və ya diqqətləri pasiyentdə ikən proqramdan istifadə etdiyi üçün, <strong>bütün pəncərələrə sürətli klaviatur qısayolları (shortcuts, məs. Ctrl+N, ESC)</strong> yerləşdirilməlidir.
        </p>
      </div>
    </div>
  );
}
