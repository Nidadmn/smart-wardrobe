export const yapayZekadanKombinIste = async (gardiropVerileri, requestId = Date.now()) => {
  try {
    const response = await fetch('http://192.168.203.50:5000/api/kombin-uret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gardiropVerileri,
        requestId: String(requestId),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('Kombin API hatası:', data);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.log('AI danışman bağlantı hatası:', error);
    return [];
  }
};