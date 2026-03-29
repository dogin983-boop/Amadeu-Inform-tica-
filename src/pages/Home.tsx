import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types';
import { ShoppingCart, ExternalLink, Filter } from 'lucide-react';
import { motion } from 'motion/react';

const CATEGORIES: Category[] = ["Lan House", "Papelaria", "Tech", "Fotografia", "Topos de Bolo", "Manutenção"];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todos'>('Todos');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = selectedCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleInterest = (product: Product) => {
    const message = encodeURIComponent(`Olá! Tenho interesse no serviço/produto: ${product.name} (${product.category})`);
    window.open(`https://wa.me/558233244486?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4 py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-4xl md:text-5xl font-extrabold text-royal-blue tracking-tight">
          Amadeu <span className="text-gold-beige">Informática</span>
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Sua solução completa em tecnologia, papelaria personalizada e entretenimento.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 pt-4 text-sm font-semibold text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="text-royal-blue">📍</span>
            <span>Santa Amelia, Maceió - AL</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-royal-blue">📞</span>
            <span>(82) 3324-4486</span>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-4">
          <div className="flex items-center space-x-2 text-royal-blue font-bold mb-4">
            <Filter className="w-5 h-5" />
            <span>Categorias</span>
          </div>
          <div className="flex flex-wrap md:flex-col gap-2">
            <button
              onClick={() => setSelectedCategory('Todos')}
              className={`px-4 py-2 rounded-lg text-left transition-all ${selectedCategory === 'Todos' ? 'bg-royal-blue text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              Todos
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-left transition-all ${selectedCategory === cat ? 'bg-royal-blue text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card h-80 animate-pulse bg-gray-200"></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={product.id}
                  className="card group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={product.imageUrl || `https://picsum.photos/seed/${product.name}/400/300`}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-gold-beige text-white text-xs font-bold px-2 py-1 rounded">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{product.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 h-10">{product.description}</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-royal-blue font-bold text-xl">
                        {product.price > 0 ? `R$ ${product.price.toFixed(2)}` : 'Sob consulta'}
                      </span>
                      <button
                        onClick={() => handleInterest(product)}
                        className="btn-primary flex items-center space-x-2 text-sm px-4"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Tenho Interesse</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500">Nenhum produto ou serviço encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
