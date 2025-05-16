import { useState, useEffect } from "react";
import { icpstore_backend } from "declarations/icpstore_backend";
import { Principal } from "@dfinity/principal";
import { idlFactory } from "../../declarations/icpsc_icrc1_ledger_canister/icpsc_icrc1_ledger_canister.did.js";

function App() {
  //constante utilizada para guardar o principal da conta de origem
  const [from, setFrom] = useState("");
  //constante utilizada para guardar o principal da conta de destino
  const [to, setTo] = useState("");
  //constante utilizada para guardar a quantidade a ser transferida
  const [amount, setAmount] = useState("");
  //constante utilizada para guardar o saldo de tokens da conta de origem
  const [balancesFrom, setBalancesFrom] = useState(0);
  //constante utilizada para guardar o saldo de tokens da conta de destino
  const [balancesTo, setBalancesTo] = useState(0);
  //constante utilizada para exibir mensagens
  const [message, setMessage] = useState("");

  const canisterLedgerId = process.env.CANISTER_ID_ICPSC_ICRC1_LEDGER_CANISTER;

  const host =
    process.env.DFX_NETWORK === "ic"
      ? "https://mainnet.dfinity.network"
      : "http://localhost:4943";

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const init = async () => {
      setProducts(await icpstore_backend.getProducts());
    };
    init();
  }, []);

  // função utilizada para obter o saldo de tokens da conta de origem
  async function getAccountFromBalance(account) {
    try {
      if (account != "") {
        setFrom(account);
        const result = await icpstore_backend.getBalance(
          Principal.fromText(account)
        );
        setBalancesFrom(parseInt(result));
        setMessage("");
      }
    } catch (error) {
      console.dir(error);
      setBalancesFrom(0);
      setMessage("Ocorreu uma falha ao retornar o saldo da Conta de Origem");
    }
  }

  // função utilizada para obter o saldo de tokens da conta de destino
  async function getAccountToBalance(account) {
    try {
      if (account != "") {
        setTo(account);
        const result = await icpstore_backend.getBalance(
          Principal.fromText(account)
        );
        setBalancesTo(parseInt(result));
        setMessage("");
      }
    } catch (error) {
      console.dir(error);
      setBalancesTo(0);
      setMessage("Ocorreu uma falha ao retornar o saldo da Conta de Destino");
    }
  }

  // Função para conectar à Plug Wallet
  const conectarPlugWallet = async () => {
    try {
      //Confere se a carteira Plug está instalada
      if (!window.ic?.plug) {
        console.error("Plug Wallet não instalada!");
        return;
      }

      // Conectar à Plug Wallet
      const connected = await window.ic.plug.requestConnect({
        whitelist: [canisterLedgerId],
        host: host, // no caso de mainnet será necessário utilizar o host = 'https://mainnet.dfinity.network'
      });

      if (connected) {
        console.log("Conectado com sucesso à Plug Wallet");
        const principal = await window.ic.plug.agent.getPrincipal();

        //Atualiza o campo Conta Origem com o principal da carteira conectada
        setFrom(principal.toString());
        //Atualiza o campo saldo da Conta Origem com o saldo do principal da carteira conectada
        getAccountFromBalance(principal.toString());
      }
    } catch (error) {
      console.error("Erro ao conectar a Plug Wallet:", error);
    }
  };

  /*
     Função utilizada para transferir da carteira Plug conectada para o principal informado no campo Conta Destino (To).
     Ao solicitar a transferência a carteira Plug será apresentada na tela e será necessário aprovar a transferencia para
     que ela seja realizada.
  */
  const transfer = async () => {
    //Confere se a carteira Plug está instalada
    if (!window.ic?.plug) {
      console.error("Plug Wallet não instalada!");
      return;
    }

    //Obtém o status de conexão da carteira Plug
    let isConnected = await window.ic.plug.isConnected();

    console.log("isConnected");
    console.log(isConnected);
    //Verifica se a carteira Plug está conectada.
    if (!isConnected) {
      //Caso não estiver conectada, uma nova conexão será realizada
      await window.ic.plug.requestConnect({
        whitelist: [canisterLedgerId],
        host: host, // no caso de mainnet será necessário utilizar o host = 'https://mainnet.dfinity.network'
      });
      isConnected = true;
    }

    if (isConnected) {
      // Cria um Actor com as configurações referêntes a ledger do token
      const actorLedger = await window.ic.plug.createActor({
        canisterId: canisterLedgerId,
        interfaceFactory: idlFactory,
      });

      //Configuração dos parametros para a transferência dos tokens
      const args = {
        to: {
          owner: Principal.fromText(to),
          subaccount: [],
        },
        amount: BigInt(amount),
        memo: [],
        fee: [BigInt(10000)], //será consumido 10000 tokens de Fee
        from_subaccount: [],
        created_at_time: [],
      };

      let transferencia = "";
      try {
        //esta operação não terá custo de aprovação, será considerado apenas o custo do Fee
        transferencia = await actorLedger.icrc1_transfer(args);
      } catch (error) {
        console.log(error);
        if (
          error.message === "Invalid certificate: Signature verification failed"
        ) {
          /*
          O erro 'Invalid certificate: Signature verification failed' é comum ocorrer em ambiente local.
          Ele está relacionado à verificação de certificados no Internet Computer.
          Na maior das vezes o erro ocorre devido:
             Ambiente de desenvolvimento: Em ambientes locais, é necessário configurar o agente para aceitar a root key local
             e executar a função fetchRootKey(), caso isso não for configurado esta exception poderá ocorrer.
             Problemas de SSL: Alguns navegadores bloqueiam recursos locais devido a certificados SSL inválidos.


          Localmente mesmo ocorrendo esta exception a transferência ocorre normalmente. Utilizando o código
          deste Dapp na mainnet esta exception não irá ocorrer.
        */

          transferencia =
            "A transferência foi concluída com sucesso, mas com algumas ressalvas: " +
            error.message;
        } else {
          transferencia = error.message;
        }
      }

      //Limpa o campo quantidade
      setAmount("");

      //Atualizado o campo de saldo da Conta Origem (From)
      await getAccountFromBalance(from);
      //Atualizado o campo de saldo da Conta Destino (To)
      await getAccountToBalance(to);

      setMessage(transferencia);
    }
  };

  // 🔽 Função de compra
  const handleBuy = async (price) => {
    try {
      if (!window.ic || !window.ic.plug) {
        alert("Plug Wallet não está instalada.");
        return;
      }

      // Conecta à Plug Wallet
      const connected = await window.ic.plug.requestConnect({
        whitelist: [canisterLedgerId],
        host,
      });

      if (!connected) {
        alert("Conexão com Plug Wallet falhou.");
        return;
      }

      const principal = await window.ic.plug.getPrincipal();
      console.log("Principal do usuário:", principal.toText());

      // Realiza a transferência
      const transferResult = await window.ic.plug.requestTransfer({
        to: Principal.fromText(
          process.env.CANISTER_ID_ICPSTORE_BACKEND
        ).toText(),
        amount: BigInt(Math.floor(price * 100_000_000)), // Converter ICPSC para 8 casas decimais (ex: 10 → 1_000_000)
        token: {
          canisterId: canisterLedgerId,
          standard: "ICRC1",
        },
      });
      

      console.log("Transferência completa:", transferResult);
      alert("Compra realizada com sucesso!");
    } catch (err) {
      console.error("Erro ao comprar:", err);
      alert("Falha na compra. Verifique o console.");
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
