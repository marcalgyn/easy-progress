import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Cfop from 'App/Models/Cfop';
import ItensNotaFiscal from 'App/Models/ItensNotaFiscal';
import Ncm from 'App/Models/Ncm';
import NotaFiscal from 'App/Models/NotaFiscal';

export default class ProcessosController {

  private onlyNumbers = (value: string) => value !== null ? value.replace(/[^\d]+/g, '') : 0

  public async process({ request, response, session }: HttpContextContract) {

    const cfops = await Cfop.all()
    const ncms = await Ncm.all()

    const filesXml = request.files('resume')

    const cnpjEmpresa = this.onlyNumbers(request.input('cnpjEmpresa'))
    

    const majoracao = request.input('majoracao')
    const aliquotaMajoracao = request.input('aliquota')

    console.log('majoracao', majoracao)
    console.log('aliquota', aliquotaMajoracao)

    if (filesXml) {
      for (let fileXml of filesXml) {
        await fileXml.move(Application.tmpPath('uploads'))
      }
      console.log('Quantidade de arquivos:', filesXml.length)
    } else {
      session.flash('notification', `Não foi possível processar o arquivo ${filesXml} !`)
      return response.redirect('back')
    }

    let fs = require('fs')
    const convert = require('xml-js')
    let msg: string = ""

    for (let fileXml of filesXml) {

      const xml = fs.readFileSync(fileXml.filePath, 'utf-8')
      let options = {
        nativeType: true,
        trim: true,
        ignoreComment: true,
        nativeTypeAttributes: true,
        compact: true,
      }
      let json = convert.xml2js(xml, options)

      /***********************************************
        Inicio ==> Create NotaFiscal
      ************************************************/

      const notaFiscalObj = {
        nf: json.nfeProc.NFe.infNFe.ide.nNF._text,
        modelo: json.nfeProc.NFe.infNFe.ide.mod._text,
        serie: json.nfeProc.NFe.infNFe.ide.serie._text,
        dataEmissao: json.nfeProc.NFe.infNFe.ide.dhEmi._text,
        cnpjEmitente: json.nfeProc.NFe.infNFe.emit.CNPJ !== undefined ? ('00000000000000' + json.nfeProc.NFe.infNFe.emit.CNPJ._text).slice(-14) : ('00000000000' + json.nfeProc.NFe.infNFe.emit.CPF._text).slice(-11),
        nomeEmitente: json.nfeProc.NFe.infNFe.emit.xNome._text,
        cnpjDestinatario: json.nfeProc.NFe.infNFe.dest.CNPJ !== undefined ? ('00000000000000' + json.nfeProc.NFe.infNFe.dest.CNPJ._text.toString()).slice(-14) : ('00000000000' + json.nfeProc.NFe.infNFe.dest.CPF._text.toString()).slice(-11),
        nomeCliente: json.nfeProc.NFe.infNFe.dest.xNome._text,
        valorTotal: json.nfeProc.NFe.infNFe.total.ICMSTot.vNF._text,
      }
      console.log("CNPJ da Empresa Cadastrado: ", cnpjEmpresa)
      console.log("Cnpj Capturado no XML da Empresa: ", notaFiscalObj.cnpjDestinatario)
      
      if (cnpjEmpresa == notaFiscalObj.cnpjDestinatario) {

        try {
          // Salva uma NF no banco de dados
          const notaFiscal = (await NotaFiscal.create(notaFiscalObj)).serialize();

          /***********************************************
            Fim ==> Create NotaFiscal
          ************************************************/

          if (json.nfeProc.NFe.infNFe.det instanceof Array) {
            const vetDet: any[] = json.nfeProc.NFe.infNFe.det;
            console.log('Elementos itens da nota: ', vetDet.length)
            let contador = 0;
            vetDet.forEach(async element => {

              const cfop = cfops.find((value) => value.codigo === element.prod.CFOP._text)

              if (cfop !== undefined) {

                /***********************************************
                  Inicio ==> Create ItensNotaFiscal
                ************************************************/

                let itensNotaFiscalObj: any = {
                  descricao: element.prod.xProd._text,
                  cfop: element.prod.CFOP._text,
                  ncm: element.prod.NCM._text,
                }

                itensNotaFiscalObj.nf = notaFiscalObj.nf

                if (majoracao === 'true') {
                  itensNotaFiscalObj.percentual = parseFloat(aliquotaMajoracao)
                } else {

                  let ncmXml = element.prod.NCM._text.toString()
                  let ncm: any

                  for (let index = 0; index < ncms.length; index++) {
                    const element = ncms[index];

                    let ncmStr = element.codigo.toString()
                    let tam = ncmStr.length
                    let ncmXmlAux = ncmXml.substring(0, tam)
                    if (ncmStr === ncmXmlAux) {
                      ncm = element
                      break
                    }
                  }

                  if (ncm !== undefined) {
                    itensNotaFiscalObj.percentual = ncm.aliquota
                  } else {
                    itensNotaFiscalObj.percentual = 0.0
                  }
                }

                itensNotaFiscalObj.valorUnitario = element.prod.vUnCom._text
                itensNotaFiscalObj.quantidade = element.prod.qCom._text
                itensNotaFiscalObj.valorBruto = element.prod.vProd._text
                itensNotaFiscalObj.ipi = (element.imposto.ICMS.IPI !== undefined) ? element.imposto.ICMS.IPI.IPITrib.vIPI._text : 0.0
                itensNotaFiscalObj.valorDesconto = (element.prod.vDesc !== undefined) ? element.prod.vDesc._text : 0.0
                itensNotaFiscalObj.despesasAcessorias = (element.prod.vOutro !== undefined) ? element.prod.vOutro._text : 0.0
                itensNotaFiscalObj.valorFrete = (element.prod.vFrete !== undefined) ? element.prod.vFrete._text : 0.0

                if (element.imposto.ICMS.ICMSSN101 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 18.0
                  itensNotaFiscalObj.valorIcms = itensNotaFiscalObj.valorBruto * 0.03
                  itensNotaFiscalObj.cst = 101

                } else if (element.imposto.ICMS.ICMSSN102 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 18.0
                  itensNotaFiscalObj.valorIcms = itensNotaFiscalObj.valorBruto * 0.03
                  itensNotaFiscalObj.cst = 102

                } else if (element.imposto.ICMS.ICMSSN103 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 18.0
                  itensNotaFiscalObj.valorIcms = itensNotaFiscalObj.valorBruto * 0.03
                  itensNotaFiscalObj.cst = 103

                } else if (element.imposto.ICMS.ICMSSN201 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 201

                } else if (element.imposto.ICMS.ICMSSN202 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 202

                } else if (element.imposto.ICMS.ICMSSN203 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 203

                } else if (element.imposto.ICMS.ICMSSN300 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 300

                } else if (element.imposto.ICMS.ICMSSN400 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 400

                } else if (element.imposto.ICMS.ICMSSN500 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 500

                } else if (element.imposto.ICMS.ICMSSN900 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 900

                } else if (element.imposto.ICMS.ICMS00 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = (element.imposto.ICMS.ICMS00.pICMS !== undefined) ? element.imposto.ICMS.ICMS00.pICMS._text : 0.0
                  itensNotaFiscalObj.valorIcms = (element.imposto.ICMS.ICMS00.vICMS !== undefined) ? element.imposto.ICMS.ICMS00.vICMS._text : 0.0
                  itensNotaFiscalObj.cst = 0

                } else if (element.imposto.ICMS.ICMS10 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 10

                } else if (element.imposto.ICMS.ICMS20 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = (element.imposto.ICMS.ICMS20.pICMS !== undefined) ? element.imposto.ICMS.ICMS20.pICMS._text : 0.0
                  itensNotaFiscalObj.valorIcms = (element.imposto.ICMS.ICMS20.vICMS !== undefined) ? element.imposto.ICMS.ICMS20.vICMS._text : 0.0
                  itensNotaFiscalObj.cst = 20

                } else if (element.imposto.ICMS.ICMS30 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 30

                } else if (element.imposto.ICMS.ICMS40 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 40

                } else if (element.imposto.ICMS.ICMS41 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 41

                } else if (element.imposto.ICMS.ICMS50 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 50

                } else if (element.imposto.ICMS.ICMS51 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 51

                } else if (element.imposto.ICMS.ICMS60 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 60

                } else if (element.imposto.ICMS.ICMS70 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 70

                } else if (element.imposto.ICMS.ICMS90 !== undefined) {
                  itensNotaFiscalObj.aliquotaIcms = 0.0
                  itensNotaFiscalObj.valorIcms = 0.0
                  itensNotaFiscalObj.cst = 90

                } else {
                  console.log('Aliquota ICMS: ', 0.0)
                  console.log('Valor ICMS: ', 0.0)
                  console.log('CST: ', '')
                }
                contador++

                const vlrSubTotal = (itensNotaFiscalObj.valorBruto + itensNotaFiscalObj.ipi + itensNotaFiscalObj.valorFrete + itensNotaFiscalObj.despesasAcessorias) -
                  (itensNotaFiscalObj.valorDesconto)
                itensNotaFiscalObj.subTotal = vlrSubTotal

                const vlrImposto = ((vlrSubTotal * (itensNotaFiscalObj.percentual / 100) + vlrSubTotal) * (itensNotaFiscalObj.aliquotaIcms / 100)) - itensNotaFiscalObj.valorIcms
                itensNotaFiscalObj.valorImposto = vlrImposto < 0 ? 0 : vlrImposto

                itensNotaFiscalObj.notaFiscalId = notaFiscal.id
                await ItensNotaFiscal.create(itensNotaFiscalObj)
                /***********************************************
                  Fim ==> Create NotaFiscal
                ************************************************/
              }

            });
            console.log('Contador: ', contador)
          } else {
            const element = json.nfeProc.NFe.infNFe.det

            const cfop = cfops.find((value) => value.codigo === element.prod.CFOP._text)

            if (cfop !== undefined) {

              /***********************************************
                  Inicio ==> Create ItensNotaFiscal
                ************************************************/

              let itensNotaFiscalObj: any = {
                descricao: element.prod.xProd._text,
                cfop: element.prod.CFOP._text,
                ncm: element.prod.NCM._text,
              }

              itensNotaFiscalObj.nf = notaFiscalObj.nf

              if (majoracao === 'true') {
                itensNotaFiscalObj.percentual = parseFloat(aliquotaMajoracao)
              } else {
                console.log('Elementos itens da nota')
                let ncmXml = element.prod.NCM._text.toString()
                let ncm: any

                for (let index = 0; index < ncms.length; index++) {
                  const element = ncms[index];

                  let ncmStr = element.codigo.toString()
                  let tam = ncmStr.length
                  let ncmXmlAux = ncmXml.substring(0, tam)
                  if (ncmStr === ncmXmlAux) {
                    ncm = element
                    break
                  }
                }

                if (ncm !== undefined) {
                  itensNotaFiscalObj.percentual = ncm.aliquota
                } else {
                  itensNotaFiscalObj.percentual = 0.0
                }
              }

              console.log('percentual', itensNotaFiscalObj.percentual)

              itensNotaFiscalObj.valorUnitario = element.prod.vUnCom._text
              itensNotaFiscalObj.quantidade = element.prod.qCom._text
              itensNotaFiscalObj.valorBruto = element.prod.vProd._text
              itensNotaFiscalObj.ipi = (element.imposto.ICMS.IPI !== undefined) ? element.imposto.ICMS.IPI.IPITrib.vIPI._text : 0.0
              itensNotaFiscalObj.valorDesconto = (element.prod.vDesc !== undefined) ? element.prod.vDesc._text : 0.0
              itensNotaFiscalObj.despesasAcessorias = (element.prod.vOutro !== undefined) ? element.prod.vOutro._text : 0.0
              itensNotaFiscalObj.valorFrete = (element.prod.vFrete !== undefined) ? element.prod.vFrete._text : 0.0

              if (element.imposto.ICMS.ICMSSN101 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 18.0
                itensNotaFiscalObj.valorIcms = itensNotaFiscalObj.valorBruto * 0.03
                itensNotaFiscalObj.cst = 101

              } else if (element.imposto.ICMS.ICMSSN102 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 18.0
                itensNotaFiscalObj.valorIcms = itensNotaFiscalObj.valorBruto * 0.03
                itensNotaFiscalObj.cst = 102

              } else if (element.imposto.ICMS.ICMSSN103 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 18.0
                itensNotaFiscalObj.valorIcms = itensNotaFiscalObj.valorBruto * 0.03
                itensNotaFiscalObj.cst = 103

              } else if (element.imposto.ICMS.ICMSSN201 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 201

              } else if (element.imposto.ICMS.ICMSSN202 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 202

              } else if (element.imposto.ICMS.ICMSSN203 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 203

              } else if (element.imposto.ICMS.ICMSSN300 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 300

              } else if (element.imposto.ICMS.ICMSSN400 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 400

              } else if (element.imposto.ICMS.ICMSSN500 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 500

              } else if (element.imposto.ICMS.ICMSSN900 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 900

              } else if (element.imposto.ICMS.ICMS00 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = (element.imposto.ICMS.ICMS00.pICMS !== undefined) ? element.imposto.ICMS.ICMS00.pICMS._text : 0.0
                itensNotaFiscalObj.valorIcms = (element.imposto.ICMS.ICMS00.vICMS !== undefined) ? element.imposto.ICMS.ICMS00.vICMS._text : 0.0
                itensNotaFiscalObj.cst = 0

              } else if (element.imposto.ICMS.ICMS10 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 10

              } else if (element.imposto.ICMS.ICMS20 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = (element.imposto.ICMS.ICMS20.pICMS !== undefined) ? element.imposto.ICMS.ICMS20.pICMS._text : 0.0
                itensNotaFiscalObj.valorIcms = (element.imposto.ICMS.ICMS20.vICMS !== undefined) ? element.imposto.ICMS.ICMS20.vICMS._text : 0.0
                itensNotaFiscalObj.cst = 20

              } else if (element.imposto.ICMS.ICMS30 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 30

              } else if (element.imposto.ICMS.ICMS40 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 40

              } else if (element.imposto.ICMS.ICMS41 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 41

              } else if (element.imposto.ICMS.ICMS50 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 50

              } else if (element.imposto.ICMS.ICMS51 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 51

              } else if (element.imposto.ICMS.ICMS60 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 60

              } else if (element.imposto.ICMS.ICMS70 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 70

              } else if (element.imposto.ICMS.ICMS90 !== undefined) {
                itensNotaFiscalObj.aliquotaIcms = 0.0
                itensNotaFiscalObj.valorIcms = 0.0
                itensNotaFiscalObj.cst = 90

              } else {
                console.log('Aliquota ICMS: ', 0.0)
                console.log('Valor ICMS: ', 0.0)
                console.log('CST: ', '')
              }

              
              const vlrSubTotal = (itensNotaFiscalObj.valorBruto + itensNotaFiscalObj.ipi + itensNotaFiscalObj.valorFrete + itensNotaFiscalObj.despesasAcessorias) -
                (itensNotaFiscalObj.valorDesconto)
              itensNotaFiscalObj.subTotal = vlrSubTotal

              const vlrImposto = ((vlrSubTotal * (itensNotaFiscalObj.percentual / 100) + vlrSubTotal) * (itensNotaFiscalObj.aliquotaIcms / 100)) - itensNotaFiscalObj.valorIcms
              itensNotaFiscalObj.valorImposto = vlrImposto < 0 ? 0 : vlrImposto

              itensNotaFiscalObj.notaFiscalId = notaFiscal.id
              await ItensNotaFiscal.create(itensNotaFiscalObj)
              /***********************************************
              Fim ==> Create NotaFiscal
            ************************************************/
            }

          }
          msg += `Arquivo NF ${notaFiscalObj.nf} processado com sucesso! \n`
          session.flash('notification', msg)
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            msg += `Nota Fiscal com o Número ${notaFiscalObj.nf}, CNPJ ${notaFiscalObj.cnpjEmitente} já foi cadastrada. \n`
          }
          session.flash('notification', msg)
        }

      }

    }

    return response.redirect('back')
  }
}