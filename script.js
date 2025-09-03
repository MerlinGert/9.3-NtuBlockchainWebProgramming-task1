/* Init */
let web3, userAccount, isWalletConnected = false, currentTokenSelection = 'from';

const supportedTokens = [
    {symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', price: 4296.04},
    {symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', price: 1.00},
    {symbol: 'USDT', name: 'Tether USD', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', price: 1.00},
    {symbol: 'DAI', name: 'Dai Stablecoin', icon: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', price: 1.00}
];

$(document).ready(function() {
    window.gtag = window.gtag || function() { console.log('gtag:', arguments); };
    initializeApp(); updateBalanceDisplay('0.0000', 'ETH');
});

function initializeApp() {
    checkMetaMaskAvailability(); bindEventListeners();
    initializeTokenList(); checkExistingConnection();
}


/* WalletCheck */
function checkMetaMaskAvailability() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = typeof window.Web3 !== 'undefined' ? new window.Web3(window.ethereum) : null;
    } else {
        showInstallMetaMaskMessage();
    }
}



function showInstallMetaMaskMessage() {
    $('#connectWallet').text('Install MetaMask');
    $('#balanceDisplay').text('Please install MetaMask to continue');
}

function bindEventListeners() {
    $('#connectWallet').click(() => connectWallet());
    $('#fromToken').click(() => { currentTokenSelection = 'from'; showTokenModal(); });
    $('#toToken').click(() => { currentTokenSelection = 'to'; showTokenModal(); });
    $('#swapDirection').click(() => swapTokenPositions());
    $('#fromAmount').on('input', () => { calcToAmt(); updateUSDValue(); updateExRate(); });
    $('.refresh-icon').click(() => updateExRate());
    $('#tokenSearch').on('input', function() { filterTokenList($(this).val()); });
}


async function checkExistingConnection() {
    if (typeof window.ethereum === 'undefined')
        return;

    const accounts = await window.ethereum.request({ method: 'eth_accounts' }).catch(() => []);

    if (accounts.length > 0) {
        userAccount = accounts[0];
        isWalletConnected = true;
        updateWalletUI();
        getETHBalance();
        getCurrentTokenBalance();
    }
}

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showInstallMetaMaskMessage();
        return false;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }).catch(() => []);

    if (accounts.length > 0) {
        userAccount = accounts[0];
        isWalletConnected = true;
        updateWalletUI();
        getETHBalance();
        getCurrentTokenBalance();
        return true;
    }
    return false;
}


function updateWalletUI() {
    const shortAddress = userAccount.substring(0, 6) + '...' + userAccount.slice(-4);
    $('#connectWallet').text(shortAddress);
}

function updateBalanceDisplay(tmpBalance, token) {
    $('#balanceStatusText').text(`${tmpBalance} ${token} available to swap`);
}

async function getETHBalance() {
    if (!userAccount || !web3)
        return updateBalanceDisplay('0.00', 'ETH');

    const tmpWei = await web3.eth.getBalance(userAccount).catch(() => '0');
    const tmpETH = web3.utils.fromWei(tmpWei, 'ether');
    updateBalanceDisplay(parseFloat(tmpETH).toFixed(4), 'ETH');
}



/* Token */
function initializeTokenList() {
    const tokenListContainer = $('#tokenList');
    tokenListContainer.empty();

    supportedTokens.forEach(token => {
        const tokenItem = $(`
            <div class="token-item" data-symbol="${token.symbol}" data-name="${token.name}" data-icon="${token.icon}" data-address="${token.address}">
                <img src="${token.icon}" alt="${token.symbol}" class="token-icon">
                <div class="token-info">
                    <div class="token-symbol">${token.symbol}</div>
                    <div class="token-name">${token.name}</div>
                </div>
            </div>
        `);
        tokenItem.click(() => selectToken(token));
        tokenListContainer.append(tokenItem);
    });
}

function selectToken(token) {
    if (currentTokenSelection === 'from') {
        utils.updateTokenDisplay('from', token);
    } else {
        $('#toToken').html(`
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <img src="${token.icon}" alt="${token.symbol}" class="token-icon me-2">
                    <span class="token-symbol">${token.symbol}</span>
                </div>
                <i class="bi bi-chevron-down"></i>
            </div>
        `);
    }
    $('#tokenModal').modal('hide');
    setTimeout(() => delayedUpdate(), 300);
}

function getCurrentFromToken() { return utils.getCurrentToken('from'); }

function getCurrentToToken() {
    const tokText = utils.getCurrentToken('to');
    if (tokText === 'Select token') {
        return null;
    }
    return tokText;
}


function getCurrentTokenBalance() {
    const currentToken = getCurrentFromToken();
    currentToken === 'ETH' ? getETHBalance() : updateBalanceDisplay('0.0000', currentToken);
}

// Unified delayed update function
function delayedUpdate() {
    getCurrentTokenBalance();
    updateExRate();
    const fromAmount = $('#fromAmount').val();
    if (fromAmount && fromAmount > 0) {
        calcToAmt();
        updateUSDValue();
    }
}


function showTokenModal() { $('#tokenModal').modal('show'); }


function filterTokenList(searchTerm) {
    $('.token-item').each(function() {
        const symbol = $(this).data('symbol').toLowerCase();
        const name = $(this).data('name').toLowerCase();
        const search = searchTerm.toLowerCase();

        if (symbol.includes(search) || name.includes(search)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

/* Swap Flow */
function swapTokenPositions() {
    const fromIcon = $('#fromToken .token-icon').attr('src');
    const fromSymbol = $('#fromToken .token-symbol').text();
    const toIcon = $('#toToken .token-icon').attr('src');
    const toSymbol = $('#toToken .token-symbol').text();

    // Swap token positions
    $('#fromToken .token-icon').attr('src', toIcon);
    $('#fromToken .token-symbol').text(toSymbol);
    $('#toToken .token-icon').attr('src', fromIcon);
    $('#toToken .token-symbol').text(fromSymbol);

    setTimeout(() => delayedUpdate(), 100);
}


async function calcToAmt() {
    const fromAmount = parseFloat($('#fromAmount').val());
    const fromToken = getCurrentFromToken();
    const toToken = getCurrentToToken();

    if (!fromAmount || fromAmount <= 0) {
        $('#toAmount').text('-');
        return;
    }

    if (!fromToken || !toToken || fromToken === toToken) {
        $('#toAmount').text('-');
        return;
    }

    const fromTok = supportedTokens.find(t => t.symbol === fromToken);
    const toTok = supportedTokens.find(t => t.symbol === toToken);

    if (fromTok && toTok) {
        try {
            // Calculate actual sellAmount based on user input
            const sellAmount = fromToken === 'ETH' ?
                (fromAmount * 1e18).toString() :
                (fromAmount * 1e6).toString();

            // Get quote using server proxy
            const quoteData = await getZeroXQuote(fromTok.address, toTok.address, sellAmount);

            if (quoteData && quoteData.liquidityAvailable) {
                // Use API returned buyAmount, considering decimal places
                const buyNum = parseFloat(quoteData.buyAmount);
                const toDec = toToken === 'ETH' ? 1e18 : 1e6;
                const toAmt = (buyNum / toDec).toFixed(6);

                console.log('[calc]', toAmt);

                $('#toAmount').text(toAmt);
                return;
            }
        } catch (error) {
            console.error('calc fail:', error);
        }
    }

    $('#toAmount').text('-');
}

async function mockQuote() {
    const fromToken = getCurrentFromToken();
    const toToken = getCurrentToToken();
    const fromAmount = $('#fromAmount').val();

    if (!fromAmount || fromAmount <= 0) {
        alert('Please enter a valid swap amount');
        return;
    }

    if (fromToken === toToken) {
        alert('Cannot select the same token for swapping');
        return;
    }

    alert(`Mock Quote Request:\nFrom ${fromAmount} ${fromToken} to ${toToken}\n\nThis is a demo version. Real quotes require connection to actual DEX aggregators.`);
}



function selectToken(token) {
    if (currentTokenSelection === 'from') {
        $('#fromToken .token-icon').attr('src', token.icon);
        $('#fromToken .token-symbol').text(token.symbol);
    } else {
        // Update toToken structure
        $('#toToken').html(`
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <img src="${token.icon}" alt="${token.symbol}" class="token-icon me-2">
                    <span class="token-symbol">${token.symbol}</span>
                </div>
                <i class="bi bi-chevron-down"></i>
            </div>
        `);
    }
    $('#tokenModal').modal('hide');
    setTimeout(() => {
        getCurrentTokenBalance();    // Update balance
        updateExRate();        // Update exchange rate
        const fromAmount = $('#fromAmount').val();
        if (fromAmount && fromAmount > 0) {
            calcToAmt();     // Recalculate amount
            updateUSDValue();        // Update USD value
        }
    }, 500);
}


function getCurrentFromToken() { return utils.getCurrentToken('from'); }



async function updateUSDValue() {
    const fromAmount = parseFloat($('#fromAmount').val());
    const fromToken = getCurrentFromToken();

    if (fromAmount && fromAmount > 0) {
        const tmpPrice = await getTmpPrice(fromToken);
        const usdVal = (fromAmount * tmpPrice).toFixed(2);
        $('#fromAmountUSD').text(`≈$${utils.formatNumber(usdVal)}`);
    } else {
        $('#fromAmountUSD').text('≈$0.00');
    }
}


// Get 0x API data using server proxy
async function getZeroXQuote(sellToken, buyToken, sellAmount) {
    try {
        const params = new URLSearchParams({
            chainId: '1',
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount: sellAmount
        });

        // Use server proxy path
        const response = await fetch(`/api/0x/swap/permit2/price?${params}`);

        if (!response.ok) {
            console.warn('api fail, use fake');
            return simulateZeroXResponse(sellToken, buyToken, sellAmount);
        }

        const data = await response.json();
        console.log('[api]', data);
        return data;
    } catch (error) {
        console.warn('api error, fake data:', error);
        return simulateZeroXResponse(sellToken, buyToken, sellAmount);
    }
}



//0x API or Fake rates
function simulateZeroXResponse(sellToken, buyToken, sellAmount) {

    //Fake rates
    // const rates = {
    //     'ETH-USDC': 4296.04, 'ETH-USDT': 4295.87, 'ETH-DAI': 4297.12,
    //     'USDC-ETH': 1/4296.04, 'USDT-ETH': 1/4295.87, 'DAI-ETH': 1/4297.12,
    //     'USDC-USDT': 1.0002, 'USDC-DAI': 0.9998, 'USDT-USDC': 0.9998,
    //     'USDT-DAI': 0.9996, 'DAI-USDC': 1.0002, 'DAI-USDT': 1.0004
    // };

    const sellSym = supportedTokens.find(t => t.address === sellToken)?.symbol;
    const buySym = supportedTokens.find(t => t.address === buyToken)?.symbol;

    if (!sellSym || !buySym) return null;

    const rateKey = `${sellSym}-${buySym}`;
    const rate = rates[rateKey];

    if (!rate) return null;

    const sellNum = parseFloat(sellAmount);
    const buyNum = sellNum * rate;

    return {
        liquidityAvailable: true,
        buyAmount: buyNum.toString(),
        sellAmount: sellAmount
    };
}

// Get token price (USD)---Fake
async function getTmpPrice(tokenSymbol) {
    if (['USDC', 'USDT', 'DAI'].includes(tokenSymbol)) {
        return 1.00;
    }
    if (tokenSymbol === 'ETH') return 4296.04;
    return 0;
}
// TODO: may next time

/* Utils */
const utils = {
    formatNumber: (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    getCurrentToken: (type) => $(`#${type}Token .token-symbol`).text() || (type === 'from' ? 'ETH' : null),
    updateTokenDisplay: (target, token) => {
        $(`#${target}Token .token-icon`).attr('src', token.icon);
        $(`#${target}Token .token-symbol`).text(token.symbol);
    }
};

/* Rate Update */
async function updateExRate() {
    const fromToken = getCurrentFromToken();
    const toToken = getCurrentToToken();

    if (!fromToken || !toToken || fromToken === toToken) {
        $('#exchangeRateText').text('Select tokens to see exchange rate');
        return;
    }

    const fromTokData = supportedTokens.find(t => t.symbol === fromToken);
    const toTokData = supportedTokens.find(t => t.symbol === toToken);

    if (!fromTokData || !toTokData) {
        $('#exchangeRateText').text('Token not supported');
        return;
    }

    try {
        // Get exchange rate using server proxy
        const sellAmt = fromToken === 'ETH' ? '1000000000000000000' : '1000000';
        const rateData = await getZeroXQuote(fromTokData.address, toTokData.address, sellAmt);

        if (!rateData || !rateData.liquidityAvailable) {
            $('#exchangeRateText').text('No liquidity available');
            return;
        }

        // Calculate exchange rate with decimals
        const buyNum = parseFloat(rateData.buyAmount);
        const sellNum = parseFloat(rateData.sellAmount);

        // Adjust decimals by token type
        const fromDec = fromToken === 'ETH' ? 1e18 : 1e6;
        const toDec = toToken === 'ETH' ? 1e18 : 1e6;

        // Calculate actual exchange rate
        const realSell = sellNum / fromDec;
        const realBuy = buyNum / toDec;
        const exRate = realBuy / realSell;

        console.log('[rate]', exRate);

        // Format display
        const displayRate = exRate > 1000 ?
            utils.formatNumber(exRate.toFixed(2)) :
            exRate.toFixed(6);

        $('#exchangeRateText').text(`1 ${fromToken} = ${displayRate} ${toToken}`);

    } catch (error) {
        console.error('rate fail:', error);
        $('#exchangeRateText').text('Unable to fetch exchange rate');
    }
}
