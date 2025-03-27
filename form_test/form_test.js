console.log('OK');

document.getElementById("payuForm").addEventListener("submit", async function(event) {
    event.preventDefault(); 
debugger;
    const API_KEY = "4Vj8eK4rloUd272L48hsrarnUA"; // Reemplaza con tu API Key
    const merchantId = this.merchantId.value;
    const referenceCode = this.referenceCode.value.trim();
    const amount = parseFloat(this.amount.value).toFixed(2);
    const currency = this.currency.value;

    const signature = generateMD5Signature(API_KEY, merchantId, referenceCode, amount, currency);

    this.signature.value = signature;

    this.submit();
});

function generateMD5Signature(apiKey, merchantId, referenceCode, amount, currency) {
    // Concatenar según la estructura de PayU
    const data = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    
    // Generar hash MD5
    return CryptoJS.MD5(data).toString().toUpperCase(); // Convertir a mayúsculas
}