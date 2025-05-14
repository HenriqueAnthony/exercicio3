import { useState, useEffect } from 'react';
import { icpstore_backend } from 'declarations/icpstore_backend';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../../declarations/icpsc_icrc1_ledger_canister/icpsc_icrc1_ledger_canister.did.js';

function App() {


  const canisterLedgerId = process.env.CANISTER_ID_ICPSC_ICRC1_LEDGER_CANISTER;
  
  const host = process.env.DFX_NETWORK === 'ic' ? 'https://mainnet.dfinity.network' : 'http://localhost:4943';
  
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const init = async () => {
      setProducts(await icpstore_backend.getProducts());
    };
    init();
  }, []);

  // 🔽 Função de compra
  const handleBuy = async (price) => {
    try {
      if (!window.ic || !window.ic.plug) {
        alert('Plug Wallet não está instalada.');
        return;
      }

      // Conecta à Plug Wallet
      const connected = await window.ic.plug.requestConnect({
        whitelist: [canisterLedgerId],
        host,
      });

      if (!connected) {
        alert('Conexão com Plug Wallet falhou.');
        return;
      }

      const principal = await window.ic.plug.getPrincipal();
      console.log('Principal do usuário:', principal.toText());

      // Realiza a transferência
      const transferResult = await window.ic.plug.requestTransfer({
        to: Principal.fromText(process.env.CANISTER_ID_ICPSTORE_BACKEND).toText(),
        amount: price * 100_000, // Converter ICPSC para 8 casas decimais (ex: 10 → 1_000_000)
        token: {
          canisterId: canisterLedgerId,
          standard: 'ICRC1',
        },
      });

      console.log('Transferência completa:', transferResult);
      alert('Compra realizada com sucesso!');
    } catch (err) {
      console.error('Erro ao comprar:', err);
      alert('Falha na compra. Verifique o console.');
    }
  };

  return (
    <div className="container">
      <h1 className="titulo">Loja de Cursos da ICP</h1>
      <div className="grade-cursos">
        {products.map((p, index) => (
          <div key={index} className="card">
            <img src={p.image} alt={p.title} className="imagem" />
            <h2 className="card-titulo">{p.title}</h2>
            <p className="descricao">{p.description}</p>
            <p className="preco">{p.price} ICPSC</p>
            <button className="botao" onClick={() => handleBuy(p.price)}>
              Comprar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
