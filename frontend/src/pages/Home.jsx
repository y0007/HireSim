import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center py-20 px-4 relative overflow-hidden font-sans">
      
      {/* Background Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob top-10 -left-10"></div>
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000 top-20 right-10"></div>
        <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000 -bottom-20 left-20"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center mt-10">
        
        {/* Sleek Logo Badge */}
        <div className="mb-10 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative w-20 h-20 bg-gray-950 rounded-2xl flex items-center justify-center transform group-hover:scale-[1.02] transition-transform duration-300">
              <span className="text-3xl font-extrabold bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tighter">
                HS
              </span>
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white leading-tight">
          Master Your Next <br/>
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Technical Interview
          </span>
        </h1>
        
        <p className="mb-12 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
          Experience AI-powered mock interviews that adapt to your skill level, simulate real-world conditions, and provide actionable engineering feedback.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/register" 
            className="px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105"
          >
            Start Preparing Now
          </Link>
          <Link 
            to="/login" 
            className="px-8 py-4 text-white font-medium rounded-xl transition-all glass-panel hover:bg-white/10"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Value Props */}
        <div className="mt-32 border-t border-white/5 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
            {[
              { 
                icon: "⚡", title: "Tailored to the JD", 
                desc: "Upload a resume and job description. The AI generates specific, targeted questions."
              },
              { 
                icon: "🎙️", title: "Whisper Voice AI", 
                desc: "Answer naturally using your microphone with highly accurate speech-to-text."
              },
              { 
                icon: "📊", title: "Actionable Analytics", 
                desc: "Get graded on communication, technical depth, and structure with a real hire probability."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl glass-panel hover:bg-white/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed font-light text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}