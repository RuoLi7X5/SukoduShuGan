import React from 'react';
import { Home, Grid3X3, Swords, ChevronDown } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

interface LayoutProps {
  children: React.ReactNode;
  currentMode: 'home' | 'last-digit' | 'slicing';
  onNavigate: (mode: 'home' | 'last-digit' | 'slicing') => void;
}

export function Layout({ children, currentMode, onNavigate }: LayoutProps) {
  const getModeLabel = () => {
    switch(currentMode) {
      case 'last-digit': return '唯余训练';
      case 'slicing': return '排除技巧';
      default: return '首页';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100 selection:bg-blue-500/30">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>
      
      <header className="bg-slate-900 md:bg-slate-900/80 md:backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => onNavigate('home')}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-md md:blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all border border-white/10">
                  <Grid3X3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                数感训练
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1 bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <NavButton 
                active={currentMode === 'home'} 
                onClick={() => onNavigate('home')}
                icon={<Home size={18} />}
                label="首页"
              />
              <NavButton 
                active={currentMode === 'last-digit'} 
                onClick={() => onNavigate('last-digit')}
                icon={<Grid3X3 size={18} />}
                label="唯余训练"
              />
              <NavButton 
                active={currentMode === 'slicing'} 
                onClick={() => onNavigate('slicing')}
                icon={<Swords size={18} />}
                label="排除技巧"
              />
            </nav>

            {/* Mobile Dropdown */}
            <div className="md:hidden">
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/20 transition-all">
                  {getModeLabel()}
                  <ChevronDown className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                </Menu.Button>
                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl bg-slate-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/10">
                    <div className="py-1">
                      <MenuItem label="首页" onClick={() => onNavigate('home')} icon={<Home size={16} />} active={currentMode === 'home'} />
                      <MenuItem label="唯余训练" onClick={() => onNavigate('last-digit')} icon={<Grid3X3 size={16} />} active={currentMode === 'last-digit'} />
                      <MenuItem label="排除技巧" onClick={() => onNavigate('slicing')} icon={<Swords size={16} />} active={currentMode === 'slicing'} />
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      <footer className="border-t border-white/5 py-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2025 数感训练系统 - 提升你的数独直觉</p>
          <p className="text-slate-500 text-sm mt-2">数独学习欢迎加QQ群：368802169</p>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group
        ${active 
          ? 'text-white shadow-lg' 
          : 'text-slate-400 hover:text-white'
        }
      `}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-100 transition-opacity"></div>
      )}
      {!active && (
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function MenuItem({ label, onClick, icon, active }: { label: string; onClick: () => void; icon: React.ReactNode; active: boolean }) {
  return (
    <Menu.Item>
      {({ active: hover }) => (
        <button
          onClick={onClick}
          className={`
            ${hover || active ? 'bg-white/10 text-white' : 'text-slate-300'}
            group flex w-full items-center px-4 py-2.5 text-sm transition-colors
          `}
        >
          <span className="mr-2 opacity-70">{icon}</span>
          {label}
        </button>
      )}
    </Menu.Item>
  );
}
