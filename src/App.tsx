import { useState } from 'react';
import LastDigitTraining from './components/LastDigitTraining';
import SlicingTraining from './components/SlicingTraining';
import { Layout } from './components/Layout';
import { Brain, Target, ArrowRight } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<'home' | 'last-digit' | 'slicing'>('home');

  return (
    <Layout currentMode={mode} onNavigate={setMode}>
      {mode === 'home' && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 md:py-20 relative">
            {/* Background Glow - Optimized with Radial Gradient instead of Blur for performance */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>

            <h2 className="relative text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
              提升你的<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">数独直觉</span>
            </h2>
            <p className="relative text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              通过针对性的专项训练，快速识别数字模式，掌握核心解题技巧。
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto relative z-10">
              <ModeCard 
                title="唯余训练" 
                subtitle="Last Digit / Hidden Single"
                description="快速识别宫、行、列中缺失的唯一数字，培养对数字 1-9 的完备性直觉。"
                icon={<Brain className="w-8 h-8 text-white" />}
                gradient="from-blue-600 to-indigo-600"
                glowColor="bg-blue-500"
                onClick={() => setMode('last-digit')}
              />
              <ModeCard 
                title="排除技巧" 
                subtitle="Slicing / Cross-Hatching"
                description="利用行列交叉排除法，在九宫格中精准定位目标数字的唯一栖息地。只有一个数字可以推理得出，题目可能全局无解。"
                icon={<Target className="w-8 h-8 text-white" />}
                gradient="from-rose-500 to-pink-600"
                glowColor="bg-rose-500"
                onClick={() => setMode('slicing')}
              />
            </div>
          </div>
        </div>
      )}
      {mode === 'last-digit' && <LastDigitTraining />}
      {mode === 'slicing' && <SlicingTraining />}
    </Layout>
  );
}

function ModeCard({ title, subtitle, description, icon, gradient, glowColor, onClick }: any) {
  // Map glowColor class (e.g. 'bg-blue-500') to a hex/rgba for gradient if possible, 
  // or just use a simplified approach. Since we can't easily parse the class string to color in runtime without a map,
  // we'll stick to a simpler optimization: disable backdrop-blur on mobile.
  
  return (
    <button 
      onClick={onClick}
      className="group relative bg-white/5 md:backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-left hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className={`absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity`}>
        {/* Optimized glow using reduced blur radius on mobile or gradient */}
        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full ${glowColor} blur-[40px] md:blur-[60px]`}></div>
      </div>
      
      <div className={`bg-gradient-to-br ${gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
        {icon}
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{title}</h3>
      <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">{subtitle}</p>
      <p className="text-slate-400 leading-relaxed mb-8 text-sm">{description}</p>
      
      <div className="flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform">
        <span className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors flex items-center">
          开始训练 <ArrowRight className="w-4 h-4 ml-2" />
        </span>
      </div>
    </button>
  );
}

export default App;
