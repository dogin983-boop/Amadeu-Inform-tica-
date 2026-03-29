import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, ShieldCheck, User, Lock, Mail, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login({ userProfile, authChecked }: { userProfile: UserProfile | null, authChecked: boolean }) {
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (authChecked && userProfile) {
      if (userProfile.role === 'super' || userProfile.role === 'admin' || userProfile.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [userProfile, authChecked, navigate]);

  const formatEmail = (input: string) => {
    if (input.includes('@')) return input;
    // For "Amadeu admin", convert to amadeuadmin@amadeu.com.br
    return `${input.replace(/\s+/g, '').toLowerCase()}@amadeu.com.br`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalEmail = formatEmail(email);
    const isAdminCredentials = (email.toLowerCase() === 'amadeu admin' || finalEmail === 'amadeuadmin@amadeu.com.br') && password === 'Csw@#$Qeo87';

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      setLoading(false);
      toast.error('Por favor, insira um e-mail ou usuário válido.');
      return;
    }

    try {
      let user;
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, finalEmail, password);
        user = result.user;
        if (name) {
          await updateProfile(user, { displayName: name });
        }
      } else {
        try {
          const result = await signInWithEmailAndPassword(auth, finalEmail, password);
          user = result.user;
        } catch (error: any) {
          // If it's the specific admin credentials and they don't exist or credentials invalid (enumeration protection), try to create them
          if (isAdminCredentials && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
            try {
              const result = await createUserWithEmailAndPassword(auth, finalEmail, password);
              user = result.user;
              await updateProfile(user, { displayName: 'Amadeu Admin' });
            } catch (createError: any) {
              // If email already in use, it means the password was wrong (if we got invalid-credential before)
              if (createError.code === 'auth/email-already-in-use') {
                throw error; // Throw the original sign-in error
              }
              throw createError;
            }
          } else {
            throw error;
          }
        }
      }

      // Check/Create user profile in Firestore
      const docRef = doc(db, 'users', user.uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        throw error;
      }

      if (!docSnap.exists()) {
        const role = (finalEmail === 'amadeuadmin@amadeu.com.br' || finalEmail === 'dogin983@gmail.com') ? 'super' : 'client';
        
        const newProfile: UserProfile = {
          uid: user.uid,
          email: finalEmail,
          name: name || user.displayName || (isAdminCredentials ? 'Amadeu Admin' : 'Usuário'),
          role: role as any,
          lastLogin: new Date().toISOString()
        };
        
        try {
          await setDoc(docRef, {
            ...newProfile,
            createdAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          throw error;
        }
        
        toast.success(`Bem-vindo, ${newProfile.name}!`);
      } else {
        const profile = docSnap.data() as UserProfile;
        try {
          await setDoc(docRef, { 
            lastLogin: new Date().toISOString() 
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
          throw error;
        }
        toast.success(`Bem-vindo de volta, ${profile.name}!`);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = 'Erro ao realizar autenticação.';
      
      if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
      else if (error.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
      else if (error.code === 'auth/email-already-in-use') message = 'Este e-mail já está em uso.';
      else if (error.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      else if (error.code === 'auth/invalid-email') message = 'E-mail inválido.';
      else if (error.code === 'auth/invalid-credential') message = 'E-mail ou senha incorretos.';
      else if (error.code === 'auth/too-many-requests') message = 'Muitas tentativas. Tente novamente mais tarde.';
      else if (error.code === 'auth/operation-not-allowed') message = 'O login por e-mail e senha não está ativado no Firebase.';
      else message = `Erro: ${error.code || error.message || 'Erro desconhecido'}`;
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6"
      >
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          {isRegistering ? <UserPlus className="w-12 h-12 text-royal-blue" /> : <LogIn className="w-12 h-12 text-royal-blue" />}
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {isRegistering ? 'Criar Nova Conta' : 'Acesse sua Conta'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isRegistering 
              ? 'Cadastre-se para agendar serviços e acompanhar seus pedidos.' 
              : 'Entre para gerenciar seus agendamentos e acessar o painel.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="text"
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-royal-blue outline-none transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">E-mail ou Usuário</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                required
                type="text"
                placeholder="exemplo@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-royal-blue outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-royal-blue outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-royal-blue text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                <span>{isRegistering ? 'Cadastrar' : 'Entrar'}</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-royal-blue font-bold text-sm hover:underline"
          >
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Ao continuar, você concorda com nossos termos de serviço e política de privacidade. 
            Dados protegidos por criptografia de ponta a ponta.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
