import Array "mo:base/Array";
import IcpscLedger "canister:icpsc_icrc1_ledger_canister";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Error "mo:base/Error";

actor Icpstore {
  //retorna nome
  public func getTokenName() : async Text {
    let name = await IcpscLedger.icrc1_name();
    return name;
  };
  // retorna symbol
  public func getTokenSymbol() : async Text {
    let symbol = await IcpscLedger.icrc1_symbol();
    return symbol;
  };
  //retorna o supply
  public func getTokenTotalSupply() : async Nat {
    let totalSupply = await IcpscLedger.icrc1_total_supply();
    return totalSupply;
  };
  //retorna a taxa de fee do token
  public func getTokenFee() : async Nat {
    let fee = await IcpscLedger.icrc1_fee();
    return fee;
  };

  //retorna o principal ID da identidade minter
  public func getTokenMintingPrincipal() : async Text {
    let mintingAccountOpt = await IcpscLedger.icrc1_minting_account();

    switch (mintingAccountOpt) {
      case (null) { return "Nenhuma conta de mintagem localizada!" };
      case (?account) {
        // Converte o principal para texto
        return Principal.toText(account.owner);
      };
    };
  };
  // um recorte com todas as informações
  type TokenInfo = {
    name : Text; //Nome completo do token (ex: "Internet Computer Protocol")
    symbol : Text; //Símbolo do token (ex: "ICP")
    totalSupply : Nat; //Quantidade total de tokens em circulação, representada como Nat (número natural não-negativo)
    fee : Nat; //Taxa de transferência do token
    mintingPrincipal : Text; //Identificador do Principal autorizado a emitir novos tokens
  };

  public func getTokenInfo() : async TokenInfo {

    let name = await getTokenName();
    let symbol = await getTokenSymbol();
    let totalSupply = await getTokenTotalSupply();
    let fee = await getTokenFee();
    let mintingPrincipal = await getTokenMintingPrincipal();

    let info : TokenInfo = {
      name = name;
      symbol = symbol;
      totalSupply = totalSupply;
      fee = fee;
      mintingPrincipal = mintingPrincipal;
    };

    return info;
  };
  //parametros de transferencia
  type TransferArgs = {
    amount : Nat; //RECEBE A QUANTIDADE QUE SERA TRANSFERIDA
    toAccount : IcpscLedger.Account; //RECEBE A CONTA DE DESTINO QUE RECEBERA OS TOKENS
  };
  /* transferir da ledger do Canister para outra conta */
  public shared func transfer(args : TransferArgs) : async Result.Result<IcpscLedger.BlockIndex, Text> {

    let transferArgs : IcpscLedger.TransferArg = {
      memo = null;
      amount = args.amount;
      from_subaccount = null;
      fee = null;
      to = args.toAccount;
      created_at_time = null;
    };

    try {
      let transferResult = await IcpscLedger.icrc1_transfer(transferArgs);

      switch (transferResult) {
        case (#Err(transferError)) {
          return #err("Não foi possível transferir fundos:
" # debug_show (transferError));
        };
        case (#Ok(blockIndex)) { return #ok blockIndex };
      };
    } catch (error : Error) {
      return #err("Mensagem de rejeição: " # Error.message(error));
    };
  };
  //Obter o saldo de tokens
  public func getBalance(owner : Principal) : async Nat {
    let balance = await IcpscLedger.icrc1_balance_of({
      owner = owner;
      subaccount = null;
    });
    return balance;
  };
  //Obter o Principal ID
  public query func getCanisterPrincipal() : async Text {
    return Principal.toText(Principal.fromActor(Icpstore));
}; 
  //obter o saldo de tokens do canister de backend 
  public func getCanisterBalance() : async Nat {
      let owner = Principal.fromActor(Icpstore);
      let balance = await getBalance(owner);      
      return balance;
 };

  type Product = {
    title : Text;
    description : Text;
    price : Text;
    image : Text;
  };

  public query func getProducts() : async [Product] {

    var products : [Product] = [];

    let p1 : Product = {
      title = "Motoko para Iniciantes";
      description = "Aprenda os fundamentos da linguagem Motoko e como criar DApps na ICP.";
      price = "50";
      image = "../motoko.jpeg";
    };
    let p2 : Product = {
      title = "Tokens ICRC-1 e ICRC-2";
      description = "Descubra como criar e gerenciar tokens na Internet Computer.";
      price = "70";
      image = "../tokens.jpeg";
    };
    let p3 : Product = {
      title = "Front-end com React na ICP";
      description = "Construa interfaces modernas para DApps usando React na ICP.";
      price = "20";
      image = "../frontend.jpeg";
    };
    let p4 : Product = {
      title = "Chain Fusion na Prática";
      description = "Entenda o o que é o projeto Chain Fusion e como utilizar ele na ICP.";
      price = "100";
      image = "../chain_fusion.jpeg";
    };
    let p5 : Product = {
      title = "Dominando HTTPS Outcalls";
      description = "Aprenda a realizar chamadas HTTPS para serviços externos a partir da blockchain da ICP.";
      price = "60";
      image = "../http.jpeg";
    };
    let p6 : Product = {
      title = "NFTs na ICP";
      description = "Aprenda como criar, mintar e vender NFTs usando a Internet Computer.";
      price = "100";
      image = "../nft.jpeg";
    };

    products := Array.append(products, [p1]);
    products := Array.append(products, [p2]);
    products := Array.append(products, [p3]);
    products := Array.append(products, [p4]);
    products := Array.append(products, [p5]);
    products := Array.append(products, [p6]);

    return products;
  };
};

