export function patchMetaMaskFillTransaction() {
  if (!window.ethereum?.request) return;

  const originalRequest = window.ethereum.request.bind(window.ethereum);

  window.ethereum.request = async (payload) => {
    const method = payload?.method;
    const params = payload?.params;

    if (method === "eth_fillTransaction") {
      const tx = (params && params[0]) ? { ...params[0] } : {};

      // Если MetaMask уже знает активный аккаунт — подставим from
      if (!tx.from) {
        try {
          const accounts = await originalRequest({ method: "eth_accounts" });
          if (accounts?.[0]) tx.from = accounts[0];
        } catch {}
      }

      // Возвращаем транзакцию "как есть" — MetaMask заполнит остальное сам при send
      return tx;
    }

    return originalRequest(payload);
  };
}
