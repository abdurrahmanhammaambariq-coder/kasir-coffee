const { useState, useEffect } = React;

/* ===== Pengaturan (silakan ubah) ===== */
const TAX = 0.1; // pajak 10%, isi 0 jika tanpa pajak
const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');

const MENU = [
  { id: 1,  n: 'Espresso',            c: 'Kopi',     p: 18000, e: '☕' },
  { id: 2,  n: 'Americano',           c: 'Kopi',     p: 22000, e: '☕' },
  { id: 3,  n: 'Cafe Latte',          c: 'Kopi',     p: 28000, e: '🥛' },
  { id: 4,  n: 'Cappuccino',          c: 'Kopi',     p: 28000, e: '☕' },
  { id: 5,  n: 'Kopi Susu Gula Aren', c: 'Kopi',     p: 25000, e: '🧋' },
  { id: 6,  n: 'Matcha Latte',        c: 'Non-Kopi', p: 30000, e: '🍵' },
  { id: 7,  n: 'Coklat Panas',        c: 'Non-Kopi', p: 26000, e: '🍫' },
  { id: 8,  n: 'Teh Lemon',           c: 'Non-Kopi', p: 20000, e: '🍋' },
  { id: 9,  n: 'Croissant',           c: 'Makanan',  p: 24000, e: '🥐' },
  { id: 10, n: 'Roti Bakar Coklat',   c: 'Makanan',  p: 22000, e: '🍞' },
  { id: 11, n: 'Kentang Goreng',      c: 'Makanan',  p: 20000, e: '🍟' },
  { id: 12, n: 'Brownies',            c: 'Makanan',  p: 18000, e: '🍰' }
];
const CATS = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan'];

/* ===== Penyimpanan riwayat di browser ===== */
function load() {
  try { return JSON.parse(localStorage.getItem('kasir_trx') || '[]'); }
  catch (e) { return []; }
}
function save(v) {
  try { localStorage.setItem('kasir_trx', JSON.stringify(v)); }
  catch (e) {}
}

/* ===== Komponen utama ===== */
function App() {
  const [view, setView] = useState('kasir');
  const [cat, setCat] = useState('Semua');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState({});
  const [pay, setPay] = useState(false);
  const [paid, setPaid] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [trx, setTrx] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => { setTrx(load()); }, []);

  const shown = MENU.filter(m =>
    (cat === 'Semua' || m.c === cat) && m.n.toLowerCase().includes(q.toLowerCase())
  );
  const lines = Object.entries(cart).map(([id, qt]) => ({ ...MENU.find(m => m.id == id), qt }));
  const sub = lines.reduce((s, l) => s + l.p * l.qt, 0);
  const tax = sub * TAX;
  const total = sub + tax;

  const add = id => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = id => setCart(c => { const n = { ...c }; n[id] > 1 ? n[id]-- : delete n[id]; return n; });
  const del = id => setCart(c => { const n = { ...c }; delete n[id]; return n; });

  function openPay() { setPaid(''); setErr(''); setPay(true); }

  function confirmPay() {
    const amt = Number(paid);
    if (!amt || amt < total) {
      setErr('Uang diterima kurang dari total. Cek lagi nominalnya.');
      return;
    }
    const r = {
      no: 'TRX-' + String(trx.length + 1).padStart(4, '0'),
      time: new Date().toISOString(),
      lines: lines.map(l => ({ n: l.n, p: l.p, qt: l.qt })),
      sub, tax, total, paid: amt, change: amt - total
    };
    const all = [r, ...trx];
    setTrx(all); save(all);
    setReceipt(r); setPay(false); setCart({});
  }

  function resetHistory() {
    if (window.confirm('Hapus semua riwayat transaksi?')) { setTrx([]); save([]); }
  }

  const today = trx.filter(t => new Date(t.time).toDateString() === new Date().toDateString());
  const omzet = today.reduce((s, t) => s + t.total, 0);
  const quick = [total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, 100000]
    .filter((v, i, a) => v >= total && a.indexOf(v) === i);

  return (
    <div className="app">
      <header>
        <h1>☕ Kopi Senja — Kasir</h1>
        <nav className="tabs">
          <button className={'tab ' + (view === 'kasir' ? 'on' : '')} onClick={() => setView('kasir')}>Kasir</button>
          <button className={'tab ' + (view === 'riwayat' ? 'on' : '')} onClick={() => setView('riwayat')}>Riwayat ({trx.length})</button>
        </nav>
      </header>

      {view === 'kasir' && <>
        <main>
          <input className="search" placeholder="Cari menu..." value={q}
                 onChange={e => setQ(e.target.value)} aria-label="Cari menu" />
          <div className="cats">
            {CATS.map(c => (
              <button key={c} className={'cat ' + (cat === c ? 'on' : '')} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="grid">
            {shown.map(m => (
              <button key={m.id} className="item" onClick={() => add(m.id)}>
                <span className="em">{m.e}</span>
                <b>{m.n}</b>
                <span className="pr">{rp(m.p)}</span>
              </button>
            ))}
            {!shown.length && <p className="empty">Menu tidak ditemukan. Coba kata kunci lain.</p>}
          </div>
        </main>

        <aside className="panel">
          <h2>Pesanan</h2>
          <div className="lines">
            {!lines.length && <p className="empty">Belum ada pesanan. Ketuk menu untuk menambahkan.</p>}
            {lines.map(l => (
              <div className="line" key={l.id}>
                <b>{l.n}</b><span>{rp(l.p * l.qt)}</span>
                <div className="qty">
                  <button onClick={() => dec(l.id)} aria-label={'Kurangi ' + l.n}>−</button>
                  <span>{l.qt}</span>
                  <button onClick={() => add(l.id)} aria-label={'Tambah ' + l.n}>+</button>
                  <button onClick={() => del(l.id)} style={{ marginLeft: 'auto', width: 'auto', padding: '0 10px' }}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
          <div className="sum">
            <div><span>Subtotal</span><span>{rp(sub)}</span></div>
            <div><span>Pajak {TAX * 100}%</span><span>{rp(tax)}</span></div>
            <div className="tot"><span>Total</span><span>{rp(total)}</span></div>
          </div>
          <button className="btn" disabled={!lines.length} onClick={openPay}>Bayar</button>
          <button className="btn ghost" disabled={!lines.length} onClick={() => setCart({})}>Kosongkan pesanan</button>
        </aside>
      </>}

      {view === 'riwayat' && (
        <section className="wide">
          <div className="stats">
            <div><b>{rp(omzet)}</b>Omzet hari ini</div>
            <div><b>{today.length}</b>Transaksi hari ini</div>
          </div>
          {!trx.length
            ? <p className="empty">Belum ada transaksi. Selesaikan pembayaran pertama di tab Kasir.</p>
            : <table className="table">
                <thead><tr><th>No</th><th>Waktu</th><th>Item</th><th>Total</th><th></th></tr></thead>
                <tbody>
                  {trx.map(t => (
                    <tr key={t.no}>
                      <td>{t.no}</td>
                      <td>{new Date(t.time).toLocaleString('id-ID')}</td>
                      <td>{t.lines.map(l => l.qt + '× ' + l.n).join(', ')}</td>
                      <td>{rp(t.total)}</td>
                      <td><button className="tab" onClick={() => setReceipt(t)}>Struk</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>}
          {!!trx.length && (
            <button className="btn ghost" style={{ width: 'auto', padding: '10px 16px' }} onClick={resetHistory}>
              Hapus riwayat
            </button>
          )}
        </section>
      )}

      {pay && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="box">
            <h2 style={{ marginTop: 0 }}>Pembayaran tunai</h2>
            <p>Total tagihan: <b>{rp(total)}</b></p>
            <input type="number" inputMode="numeric" autoFocus placeholder="Uang diterima"
                   value={paid} onChange={e => setPaid(e.target.value)} aria-label="Uang diterima" />
            <div className="quick">
              {quick.map(v => (
                <button key={v} onClick={() => setPaid(String(v))}>{v === total ? 'Uang pas' : rp(v)}</button>
              ))}
            </div>
            {paid && Number(paid) >= total && <p>Kembalian: <b>{rp(Number(paid) - total)}</b></p>}
            {err && <p className="err">{err}</p>}
            <button className="btn" onClick={confirmPay}>Selesaikan pembayaran</button>
            <button className="btn ghost" onClick={() => setPay(false)}>Batal</button>
          </div>
        </div>
      )}

      {receipt && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="box print receipt">
            <div style={{ textAlign: 'center' }}><b>KOPI SENJA</b><br />Jl. Malioboro, Yogyakarta</div><hr />
            <div className="r"><span>{receipt.no}</span><span>{new Date(receipt.time).toLocaleString('id-ID')}</span></div><hr />
            {receipt.lines.map((l, i) => (
              <div className="r" key={i}><span>{l.qt}× {l.n}</span><span>{rp(l.p * l.qt)}</span></div>
            ))}
            <hr />
            <div className="r"><span>Subtotal</span><span>{rp(receipt.sub)}</span></div>
            <div className="r"><span>Pajak</span><span>{rp(receipt.tax)}</span></div>
            <div className="r"><b>Total</b><b>{rp(receipt.total)}</b></div>
            <div className="r"><span>Tunai</span><span>{rp(receipt.paid)}</span></div>
            <div className="r"><span>Kembali</span><span>{rp(receipt.change)}</span></div><hr />
            <div style={{ textAlign: 'center' }}>Terima kasih, sampai jumpa lagi!</div>
            <div style={{ display: 'flex', gap: 8 }} className="noprint">
              <button className="btn" onClick={() => window.print()}>Cetak</button>
              <button className="btn ghost" onClick={() => setReceipt(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
