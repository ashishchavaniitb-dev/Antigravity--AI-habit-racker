async function run() {
  const key = "AIzaSyAcNXV3lovnZ2uR01HFf0JAhKw02HVAFmw";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
    } else {
      console.log("Response:", data);
    }
  } catch (e) {
    console.error(e);
  }
}
run();
