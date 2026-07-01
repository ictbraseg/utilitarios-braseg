// --- Gerenciamento de Navegação ---
function showSection(sectionId) {
    const sections = [
        'formatadores', 'texto-format', 'limpador', 'verificador-cep', 
        'geradores', 'calculadora-data', 'calculadora-juros', 
        'conversor-pessoa', 'conversor-moedas', 'conversor-temperatura', 'links'
    ];
    
    sections.forEach(s => {
        const element = document.getElementById('section-' + s);
        let linkId = 'link-' + s;
        if (s === 'verificador-cep') linkId = 'link-verificador';
        if (s === 'links') linkId = 'link-uteis';
        
        const link = document.getElementById(linkId);

        if (element) {
            element.style.display = 'none';
            element.classList.remove('active-section');
        }
        if (link) link.classList.remove('active');
    });

    const targetSection = document.getElementById('section-' + sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active-section');
    }

    // Ativar o link no menu
    let tLinkId = 'link-' + sectionId;
    if (sectionId === 'verificador-cep') tLinkId = 'link-verificador';
    if (sectionId === 'links') tLinkId = 'link-uteis';
    const tLink = document.getElementById(tLinkId);
    if (tLink) tLink.classList.add('active');
}

// --- Funções de Máscara e Validação ---

function formatarCEP(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = v;
}

function processarCPF(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = v;

    const statusDiv = document.getElementById('cpf-status');
    const cpfLimpo = v.replace(/\D/g, '');

    if (cpfLimpo.length === 11) {
        const valido = validarCPF(cpfLimpo);
        statusDiv.textContent = valido ? "✓ CPF Válido" : "✗ CPF Inválido";
        statusDiv.className = "status-msg " + (valido ? "valid" : "invalid");
    } else {
        statusDiv.textContent = "Aguardando...";
        statusDiv.className = "status-msg";
    }
}

function validarCPF(cpf) {
    if (/^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
}

function processarCNPJ(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    input.value = v;

    const statusDiv = document.getElementById('cnpj-status');
    const cnpjLimpo = v.replace(/\D/g, '');

    if (cnpjLimpo.length === 14) {
        const valido = validarCNPJ(cnpjLimpo);
        statusDiv.textContent = valido ? "✓ CNPJ Válido" : "✗ CNPJ Inválido";
        statusDiv.className = "status-msg " + (valido ? "valid" : "invalid");
    } else {
        statusDiv.textContent = "Aguardando...";
        statusDiv.className = "status-msg";
    }
}

function validarCNPJ(cnpj) {
    if (/^(\d)\1+$/.test(cnpj)) return false;
    const calc = (fatia, pesos) => {
        let soma = 0;
        for (let i = 0; i < fatia.length; i++) soma += fatia[i] * pesos[i];
        let resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const d1 = calc(cnpj.substring(0, 12), pesos1);
    const d2 = calc(cnpj.substring(0, 13), pesos2);
    return d1 === parseInt(cnpj[12]) && d2 === parseInt(cnpj[13]);
}

// --- Consulta API ---
async function consultarCEP(input) {
    formatarCEP(input);
    const cep = input.value.replace(/\D/g, '');
    const status = document.getElementById('cep-status');
    const resultado = document.getElementById('resultado-cep');

    if (cep.length === 8) {
        status.textContent = "Buscando...";
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) {
                status.textContent = "✗ Não encontrado.";
                status.className = "status-msg invalid";
                resultado.style.display = 'none';
            } else {
                status.textContent = "✓ Encontrado!";
                status.className = "status-msg valid";
                resultado.style.display = 'block';
                resultado.innerHTML = `
                    <div class="resultado-item"><strong>Logradouro:</strong> ${data.logradouro}</div>
                    <div class="resultado-item"><strong>Bairro:</strong> ${data.bairro}</div>
                    <div class="resultado-item"><strong>Cidade:</strong> ${data.localidade}/${data.uf}</div>
                `;
            }
        } catch (e) {
            status.textContent = "Erro de conexão.";
        }
    } else {
        status.textContent = "Aguardando 8 dígitos...";
        status.className = "status-msg";
        resultado.style.display = 'none';
    }	
}

// --- Funções de Geração ---

function gerarEExibirCPF() {
    const novoCpf = gerarCPF();
    const input = document.getElementById('display-cpf');
    input.value = novoCpf;
    // Chama a máscara existente para formatar
    mascaraCPF(input);
}

function gerarEExibirCNPJ() {
    const novoCnpj = gerarCNPJ();
    const input = document.getElementById('display-cnpj');
    input.value = novoCnpj;
    // Chama a máscara existente para formatar
    mascaraCNPJ(input);
}

function gerarCPF() {
    const n = () => Math.floor(Math.random() * 9);
    let n1 = n(), n2 = n(), n3 = n(), n4 = n(), n5 = n(), n6 = n(), n7 = n(), n8 = n(), n9 = n();
    
    let d1 = n9*2+n8*3+n7*4+n6*5+n5*6+n4*7+n3*8+n2*9+n1*10;
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;
    
    let d2 = d1*2+n9*3+n8*4+n7*5+n6*6+n5*7+n4*8+n3*9+n2*10+n1*11;
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;
    
    return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

function gerarCNPJ() {
    const n = () => Math.floor(Math.random() * 9);
    let n1 = n(), n2 = n(), n3 = n(), n4 = n(), n5 = n(), n6 = n(), n7 = n(), n8 = n();
    let n9 = 0, n10 = 0, n11 = 0, n12 = 1; // Final 0001 padrão
    
    let d1 = n12*2+n11*3+n10*4+n9*5+n8*6+n7*7+n6*8+n5*9+n4*2+n3*3+n2*4+n1*5;
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;
    
    let d2 = d1*2+n12*3+n11*4+n10*5+n9*6+n8*7+n7*8+n6*9+n5*2+n4*3+n3*4+n2*5+n1*6;
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;
    
    return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${n10}${n11}${n12}${d1}${d2}`;
}

// --- Lógica da Calculadora de Data ---
function calcularData(operacao) {
    const dataInput = document.getElementById('data-base').value;
    const quantidade = parseInt(document.getElementById('data-quantidade').value);
    const unidade = document.getElementById('data-unidade').value;
    const resultadoDiv = document.getElementById('resultado-data');

    if (!dataInput || isNaN(quantidade)) {
        alert("Por favor, preencha a data e a quantidade.");
        return;
    }

    // Criar objeto de data (ajustando fuso horário para local)
    let data = new Date(dataInput + 'T00:00:00');
    const valor = operacao === 'somar' ? quantidade : -quantidade;

    if (unidade === 'days') {
        data.setDate(data.getDate() + valor);
    } else if (unidade === 'months') {
        data.setMonth(data.getMonth() + valor);
    } else if (unidade === 'years') {
        data.setFullYear(data.getFullYear() + valor);
    }

    // Formatar para exibição brasileira
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });

    resultadoDiv.style.display = 'block';
    resultadoDiv.innerHTML = `
        <div class="resultado-item"><strong>Nova Data:</strong> ${dataFormatada}</div>
        <div class="resultado-item"><strong>Dia da semana:</strong> ${diaSemana}</div>
    `;
}

// --- Lógica de Limpeza de Texto ---
function limparTexto() {
    const input = document.getElementById('input-sujo').value;
    const output = document.getElementById('output-limpo');
    
    // REGEX: [^a-zA-Z0-9] significa "tudo que NÃO for letra (a-z) ou número (0-9)"
    const textoLimpo = input.replace(/[^a-zA-Z0-9]/g, '');
    
    output.value = textoLimpo;
}

function copiarTexto() {
    const output = document.getElementById('output-limpo');
    if (output.value) {
        output.select();
        document.execCommand('copy');
        alert("Texto copiado para a área de transferência!");
    }
}

function calcularJurosBoleto() {
    const valor = parseFloat(document.getElementById('juros-valor').value);
    const venc = new Date(document.getElementById('juros-vencimento').value + 'T00:00:00');
    const pag = new Date(document.getElementById('juros-pagamento').value + 'T00:00:00');
    const resultado = document.getElementById('resultado-juros');

    if (!valor || isNaN(venc) || isNaN(pag)) {
        alert("Preencha todos os campos.");
        return;
    }

    const diffDays = Math.ceil((pag - venc) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        resultado.style.display = 'block';
        resultado.innerHTML = "Boleto não está vencido.";
        return;
    }

    const multa = valor * 0.02; // Multa 2%
    const jurosDia = (valor * 0.01) / 30; // Juros 1% ao mês
    const totalJuros = jurosDia * diffDays;
    const total = valor + multa + totalJuros;

    resultado.style.display = 'block';
    resultado.innerHTML = `
        <div class="resultado-item"><strong>Atraso:</strong> ${diffDays} dias</div>
        <div class="resultado-item"><strong>Multa fixa (2%):</strong> R$ ${multa.toFixed(2)}</div>
        <div class="resultado-item"><strong>Juros acumulados:</strong> R$ ${totalJuros.toFixed(2)}</div>
        <hr style="border:0; border-top:1px solid #ddd; margin:10px 0;">
        <div class="resultado-item" style="font-size: 18px;"><strong>Total Atualizado:</strong> R$ ${total.toFixed(2)}</div>
    `;
}

// --- Funções de Formatação de Texto ---
function transformarTexto(tipo) {
    const input = document.getElementById('texto-input').value;
    let resultado = "";

    switch (tipo) {
        case 'UPPER':
            resultado = input.toUpperCase();
            break;
        case 'LOWER':
            resultado = input.toLowerCase();
            break;
        case 'TITLE':
            // Converte para minúsculo e depois a primeira letra de cada palavra para maiúsculo
            resultado = input.toLowerCase().split(' ').map(word => {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }).join(' ');
            break;
        case 'SENTENCE':
            // Apenas a primeira letra do texto em maiúsculo, o resto minúsculo
            resultado = input.toLowerCase().charAt(0).toUpperCase() + input.slice(1).toLowerCase();
            break;
    }

    document.getElementById('texto-output').value = resultado;
}

function copiarTextoFormatado() {
    const output = document.getElementById('texto-output');
    output.select();
    document.execCommand('copy');
    alert("Texto copiado!");
}

function converterCpfParaCnpj(input) {
    // Aplica máscara de CPF enquanto digita para facilitar
    let cpf = input.value.replace(/\D/g, '');
    if (cpf.length > 11) cpf = cpf.substring(0, 11);
    
    // Atualiza o valor do input com máscara de CPF
    input.value = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const displayCnpj = document.getElementById('cnpj-destino');

    if (cpf.length === 11) {
        try {
            const baseCnpj = cpf.substring(0, 8) + "0001";
            
            const mult1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const mult2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

            let temp = baseCnpj;
            
            // Primeiro dígito verificador
            let soma = 0;
            for (let i = 0; i < 12; i++) {
                soma += parseInt(temp[i]) * mult1[i];
            }
            let resto = soma % 11;
            let dv1 = resto < 2 ? 0 : 11 - resto;

            temp += dv1;

            // Segundo dígito verificador
            soma = 0;
            for (let i = 0; i < 13; i++) {
                soma += parseInt(temp[i]) * mult2[i];
            }
            resto = soma % 11;
            let dv2 = resto < 2 ? 0 : 11 - resto;

            const cnpjFinal = baseCnpj + dv1 + dv2;
            // Exibe formatado: 00.000.000/0000-00
            displayCnpj.value = cnpjFinal.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        } catch (e) {
            displayCnpj.value = "Erro no cálculo";
        }
    } else {
        displayCnpj.value = "";
    }
}

function copiarCnpjConvertido() {
    const output = document.getElementById('cnpj-destino');
    if (output.value && output.value !== "") {
        navigator.clipboard.writeText(output.value);
        alert("CNPJ copiado!");
    }
}