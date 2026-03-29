import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, ShieldCheck, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login({ userProfile }: { userProfile: UserProfile | null }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'super' || userProfile.role === 'admin' || userProfile.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [userProfile, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Create a new user profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          name: user.displayName || 'Usuário',
          role: user.email === 'dogin983@gmail.com' ? 'super' : 'client',
          lastLogin: new Date().toISOString()
        };
        
      try {
        await setDoc(docRef, {
          ...newProfile,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
        
        toast.success(`Bem-vindo, ${newProfile.name}!`);
      } else {
        const profile = docSnap.data() as UserProfile;
        // Update last login
        try {
          await setDoc(docRef, { 
            lastLogin: new Date().toISOString() 
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
        toast.success(`Bem-vindo de volta, ${profile.name}!`);
      }
      
      // Navigation is handled by useEffect
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('Erro de Domínio: Este domínio não está autorizado no Firebase. Adicione o seu domínio do Netlify nas configurações de Autenticação do Firebase.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('O popup de login foi bloqueado pelo seu navegador.');
      } else {
        toast.error('Erro ao realizar login: ' + (error.message || 'Tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6"
      >
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <User className="w-12 h-12 text-royal-blue" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Acesse sua Conta</h1>
          <p className="text-gray-500 text-sm">Entre para gerenciar seus agendamentos e acessar o painel administrativo.</p>
        </div>

        <div className="divider"></div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-200 py-3 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-royal-blue"></div>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              <span>Entrar com Google</span>
            </>
          )}
        </button>

        <div className="pt-4">
          <p className="text-xs text-gray-400">
            Ao entrar, você concorda com nossos termos de serviço e política de privacidade.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
