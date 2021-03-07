let entradas = [];
let classes = [];

function prepararCadastro() {
	$('#entrada').val('');
	$('#classe').val('');
}

function cadastrar() {
	entradas.push($('#entrada').val().toString().trim());
	classes.push($('#classe').val().toString().trim());


	let linhas = '';

	for (let i = 0; i < entradas.length; i++) {
		linhas +=
			"<tr>" +
			"<td>" + entradas[i] + "</td>" +
			"<td>" + classes[i] + "</td>" +
			"</tr>"
	}

	let opcoes = "<option value=''></option>";
	let nomeEntradas = eliminaDuplicados(entradas);

	for (let i = 0; i < nomeEntradas.length; i++) {
		opcoes += `<option value='${nomeEntradas[i]}'>${nomeEntradas[i]}</option>`;
	}

	$('#linhas').html(linhas)
	$('#sel_entrada').html(opcoes)

}

function executar() {
	let selEntradas = $('#sel_entrada').val();
	let probabilidade = '';

	let nomeClasses = retornaClasses();

	if (selEntradas.toString().trim().length > 0) {
		let Naive = NaiveBayes(selEntradas);

		for (let i = 0; i < nomeClasses.length; i++) {
			let percentual = parseFloat(Naive[nomeClasses[i]] * 100).toFixed(2);
			probabilidade += `<strong>${nomeClasses[i]}: </strong> ${percentual}% -`
		}

		probabilidade = `:${probabilidade}#`;
		probabilidade = probabilidade.replace(' - #', '')

	} else {
		probabilidade = ': 0';
	}
	$('#resultado').html(probabilidade);
}

//funcao para eliminar elementos duplicados em um array
function eliminaDuplicados(arr) {
	arr = [...new Set(arr)];
	return arr
}

//metodo para retorno de todas as classes que existem
function retornaClasses() {
	let arr = classes;
	arr = eliminaDuplicados(arr);
	return arr;
}

//criando json com as classes como chave e as entradas de cada classe  como valor
function organizar() {
	let params = {};

	for (let i = 0; i < entradas.length; i++) {
		let carac = '';
		if (i < (entradas.length - 1)) {
			carac = '-';
		}

		if (params[classes[i]]) {
			params[classes[i]] += entradas[i] + carac;
		} else {
			params[classes[i]] = entradas[i] + carac;
		}
	}

	let srt = JSON.stringify(params);
	srt = srt.replace(/-"/g, '"');
	srt = srt.replace(/-/g, ',');
	params = JSON.parse(srt);

	return params;

}

//contando quantidade palavras repetidas em um texto
function contaTexto(texto, procura) {
	return texto.split(procura).length - 1;
}

//monta o json com numero de classes para cada entrada
function frequencia() {
	let categorias = [];
	let params = {};
	let objeto = organizar();
	let labels = retornaClasses();

	for (let i = 0; i < entradas.length; i++) {
		params['Entrada'] = entradas[i];

		for (let j = 0; j < labels.length; j++) {
			params[labels[j]] = contaTexto(objeto[labels[j]], entradas[i]);
		}

		categorias[i] = JSON.stringify(params);
	}

	categorias = eliminaDuplicados(categorias);

	for (let i = 0; i < categorias.length; i++) {
		categorias[i] = JSON.parse(categorias[i]);
	}

	return categorias;

}

// retorna a quantidade de classes
function quantidadeClasses() {
	let categorias = frequencia();
	return parseInt(Object.keys(categorias[0]).length - 1);
}

// soma os valores das classes da entrada passada
function somaClasses(arr) {
	let soma = 0;
	for (let i = 1; i < arr.length; i++) {
		soma += parseInt(arr[i]);
	}
	return soma;
}

// soma dos totais de todas as classes
function somaTotaisClasses() {
	return classes.length;
}

// retorna a soma total de cada classe
function totalPorClasse() {
	let totalClasse = [];
	let nomeClasses = retornaClasses();
	let str_classes = JSON.stringify(classes);

	for (let i = 0; i < nomeClasses.length; i++) {
		totalClasse[nomeClasses[i]] = contaTexto(str_classes, nomeClasses[i]);
	}
	return totalClasse;
}

// pesos para as entradas
function entradasPeso() {
	let pesos = [];
	let categorias = frequencia();

	for (let i = 0; i < categorias.length; i++) {
		pesos[categorias[i].Entrada] = somaClasses(Object.values(categorias[i])) / somaTotaisClasses();
	}
	return pesos;
}

// pesos para as classes
function classesPeso() {
	let nomeClasses = retornaClasses();
	let totalClasses = totalPorClasse();

	let pesos = [];

	for (let i = 0; i < nomeClasses.length; i++) {
		pesos[nomeClasses[i]] = totalClasses[nomeClasses[i]] / somaTotaisClasses();
	}
	return pesos;
}

// retorna a ocorrência de uma 'Classe' para uma 'Entrada'
function ocorrenciaClasseParaEntrada(_entrada = '', _classe = '') {
	let categorias = frequencia();
	let retorno = 0;

	categorias.forEach((item) => {
		if (item['Entrada'] == _entrada) {
			retorno = parseInt(item[_classe]);
		}
	});
	return retorno;
}

// calcula a probabilidade da entrada pertencer a uma determinada classe
function NaiveBayes(_entrada = '') {
	let nomeClasses = retornaClasses();
	let totalClasse = totalPorClasse();

	let categorias = frequencia();
	let soma = 0;
	categorias.forEach((item) => {
		if (item['Entrada'] == _entrada) {
			for (let i = 0; i < nomeClasses.length; i++) {
				soma += parseInt(item[nomeClasses[i]]);
			}
		}
	});
	soma = tf.scalar(soma);

	let sumClass = tf.scalar(somaTotaisClasses());
	let probabilidade = [];
	for (let i = 0; i < nomeClasses.length; i++) {
		let ocorrencia = tf.scalar(ocorrenciaClasseParaEntrada(_entrada, nomeClasses[i]));
		let totalC = tf.scalar(totalClasse[nomeClasses[i]]);

		probabilidade[nomeClasses[i]] =
			ocorrencia.div(totalC).mul(totalC.div(sumClass)).div(soma.div(sumClass)).dataSync();
	}

	return probabilidade;
}