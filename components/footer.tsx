'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-black border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Column 1 - Company */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 relative">
                <Image
                  src="/logo.png"
                  alt="German Lion S.A."
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-white text-sm sm:text-base">German Lion S.A.</span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">
              Luxembourg Financial Structure
            </p>
          </div>
          
          {/* Column 2 - Address */}
          <div>
            <h4 className="text-white font-medium text-xs sm:text-sm mb-2 sm:mb-4">Adresse</h4>
            <div className="text-gray-400 text-xs sm:text-sm space-y-1">
              <p>22-24, Boulevard Royal</p>
              <p>L-2449 Luxembourg</p>
            </div>
          </div>
          
          {/* Column 3 - Contact */}
          <div>
            <h4 className="text-white font-medium text-xs sm:text-sm mb-2 sm:mb-4">Kontakt</h4>
            <div className="text-gray-400 text-xs sm:text-sm space-y-1">
              <p className="break-all">official@german-lion-sa.eu</p>
              <p className="break-all">support@german-lion-sa.eu</p>
            </div>
          </div>
          
          {/* Column 4 - Registry */}
          <div className="hidden md:block">
            <h4 className="text-white font-medium text-xs sm:text-sm mb-2 sm:mb-4">Register</h4>
            <div className="text-gray-400 text-xs sm:text-sm space-y-1">
              <p>RCS B255534</p>
              <p>LEI 549300OKUMPRCLI67188</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-gray-500 text-xs sm:text-sm text-center sm:text-left">
            © 2021-{new Date().getFullYear()} German Lion S.A. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link href="/home" className="text-gray-400 hover:text-white transition-colors">
              Startseite
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
