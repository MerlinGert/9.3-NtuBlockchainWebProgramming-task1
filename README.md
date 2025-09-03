Run the local and proxy server with npm start (the 0x API needs to go through the backend using a proxy replacement).

With the 0x API I registered, real-time prices can be accessed, you can use the F12 developer tools to view real-time calls to the 0x API. Since the free API account has limitations, the API is only called during interactions, not at a fixed frequency (such as every 500 ms). 

0x actually provides the swap function, but it is disabled.

After connecting the MetaMask wallet, the balance is displayed.

ETH balance: Read directly from the blockchain.

Other token balances: Displayed as 0.0000, which is simulated (retrieving the real balance would require an ERC-20 contract call).
