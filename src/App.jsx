import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, addDoc, onSnapshot, query, updateDoc, doc, deleteDoc, orderBy } from "firebase/firestore"

function App() {
  const [utangList, setUtangList] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Billease');
  const [dueDate, setDueDate] = useState('');
  const [search, setSearch] = useState('');
  
  // Feature: Dynamic Cutoff Period
  const [period, setPeriod] = useState('1st'); 
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  useEffect(() => {
    const q = query(collection(db, "utang"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setUtangList(itemsArr);
    });
    return () => unsubscribe();
  }, []);

  const appList = ["Billease", "Shopee", "Lazada", "Atome", "JuanHand", "Cashify", "MocaMoca", "MabilisCash", "Cashalo", "Fido", "Tiktok", "Gcash", "Tala", "PesoLoan", "Uno Bank", "InvestEd"];

  const addUtang = async (e) => {
    e.preventDefault();
    if (!description || !amount || !dueDate) return;
    await addDoc(collection(db, "utang"), {
      description,
      amount: parseFloat(amount),
      paidAmount: 0,
      category,
      dueDate,
      isPaid: false,
      createdAt: new Date()
    });
    setDescription(''); setAmount(''); setDueDate('');
  };

  const updatePartial = async (id, val) => {
    const pAmount = parseFloat(val) || 0;
    const utangRef = doc(db, "utang", id);
    const item = utangList.find(i => i.id === id);
    await updateDoc(utangRef, {
      paidAmount: pAmount,
      isPaid: pAmount >= item.amount
    });
  };

  const togglePaid = async (id) => {
    const utangRef = doc(db, "utang", id);
    const item = utangList.find(i => i.id === id);
    await updateDoc(utangRef, { isPaid: !item.isPaid });
  };

  const deleteItem = async (id) => {
    if(window.confirm("Sigurado ka bang buburahin mo ito?")) {
      await deleteDoc(doc(db, "utang", id));
    }
  };

  const clearPaid = async () => {
    if(window.confirm("Buburahin na lahat ng bayad sa history. Okay lang?")) {
      const paidOnly = utangList.filter(i => i.isPaid);
      paidOnly.forEach(async (item) => {
        await deleteDoc(doc(db, "utang", item.id));
      });
    }
  };

  const isUrgent = (dateString) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dateString);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  };

  // Improved Filter: Search + Month/Period logic
  const filteredActive = utangList
    .filter(i => {
      if (i.isPaid) return false;
      
      const dDate = new Date(i.dueDate);
      const today = new Date();
      
      // Ipakita lang ang utang for the current month and year
      const matchesMonth = dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear();
      if (!matchesMonth) return false;

      // Filter by period (1-15 or 16-31)
      const day = dDate.getDate();
      const matchesPeriod = period === '1st' ? day <= 15 : day >= 16;
      if (!matchesPeriod) return false;

      // Search filter
      return i.category.toLowerCase().includes(search.toLowerCase()) || 
             i.description.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => isUrgent(a.dueDate) === isUrgent(b.dueDate) ? a.category.localeCompare(b.category) : isUrgent(a.dueDate) ? -1 : 1);

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-20 flex justify-center font-sans">
      <div className="w-full max-w-md">
        
        {/* Feature: Period Selector Buttons */}
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setPeriod('1st')}
            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${period === '1st' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
          >
            {currentMonth} 1-15
          </button>
          <button 
            onClick={() => setPeriod('2nd')}
            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${period === '2nd' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
          >
            {currentMonth} 16-31
          </button>
        </div>

        {/* Dashboard */}
        <div className="bg-indigo-700 rounded-[2.5rem] p-8 shadow-xl mb-6 text-white text-center">
          <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Total Liability ({period === '1st' ? '1-15' : '16-31'})</p>
          <h1 className="text-5xl font-black tracking-tighter">
            ₱{filteredActive.reduce((a, b) => a + (b.amount - (b.paidAmount || 0)), 0).toLocaleString()}
          </h1>
        </div>

        {/* Search */}
        <input 
          className="w-full bg-white rounded-2xl px-6 py-3 mb-6 shadow-sm outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          type="text" placeholder="🔍 Search apps or notes..." value={search} onChange={(e) => setSearch(e.target.value)}
        />

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-8 border border-slate-200">
          <form onSubmit={addUtang} className="space-y-4">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none">
              {appList.map(app => <option key={app} value={app}>{app}</option>)}
            </select>
            <input className="w-full bg-slate-50 rounded-xl px-4 py-3 outline-none" type="text" placeholder="Ano ito?" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-2">
              <input className="w-1/2 bg-slate-50 rounded-xl px-4 py-3 outline-none" type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input className="w-1/2 bg-slate-50 rounded-xl px-4 py-3 outline-none text-slate-500 text-sm font-bold" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">Save to Cloud</button>
          </form>
        </div>

        {/* Active List */}
        <div className="space-y-3">
          {filteredActive.map((item) => {
            const urgent = isUrgent(item.dueDate);
            return (
              <div key={item.id} className={`bg-white p-5 rounded-3xl flex flex-col transition-all border-2 ${urgent ? 'border-red-500 animate-pulse' : 'border-transparent shadow-sm'}`}>
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase ${urgent ? 'text-red-600' : 'text-indigo-500'}`}>{item.category}</span>
                    <span className="font-bold text-slate-800">{item.description}</span>
                    <span className={`text-[10px] font-bold mt-1 ${urgent ? 'text-red-500 underline' : 'text-slate-400'}`}>Due: {item.dueDate}</span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className={`font-black text-lg ${urgent ? 'text-red-600' : 'text-slate-900'}`}>
                      ₱{(item.amount - (item.paidAmount || 0)).toLocaleString()}
                    </span>
                    <button onClick={() => deleteItem(item.id)} className="text-[9px] font-bold text-slate-300 hover:text-rose-500 uppercase">Delete</button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2 w-full">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₱</span>
                    <input 
                      type="number" 
                      placeholder="Partial payment..." 
                      className="w-full bg-slate-50 rounded-xl pl-6 pr-3 py-2 text-[11px] outline-none"
                      value={item.paidAmount || ''} 
                      onChange={(e) => updatePartial(item.id, e.target.value)}
                    />
                  </div>
                  <button onClick={() => updatePartial(item.id, item.amount)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">Full Paid</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* History */}
        <div className="mt-10 opacity-40">
           <div className="flex justify-between items-center mb-4 px-2">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History</h3>
             <button onClick={clearPaid} className="text-[10px] font-bold text-rose-500 uppercase">Clear All</button>
           </div>
           {utangList.filter(i => i.isPaid).map((item) => (
             <div key={item.id} className="bg-slate-200 p-4 rounded-2xl mb-2 flex justify-between items-center">
               <span className="line-through text-slate-500 text-xs font-bold">{item.category}: {item.description}</span>
               <button onClick={() => togglePaid(item.id)} className="text-[10px] font-bold text-indigo-500 uppercase underline">Undo</button>
             </div>
           ))}
        </div>

      </div>
    </div>
  )
}

export default App
