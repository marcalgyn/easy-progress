import View from '@ioc:Adonis/Core/View'
import moment from 'moment'

View.global('formatDate', function (date: Date) {
  return moment(date).format('DD/MM/YYYY')
})

View.global('formatCurrency', function (valor: number) {
  return valor.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
})

View.global('formatCnpj', function (strCnpj: string) {

  if (strCnpj.length === 14) {
    strCnpj = strCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  } else if (strCnpj.length < 14) {
    const diff = 14 - strCnpj.length
    for (let index = 0; index < diff; index++) {
      strCnpj = '0' + strCnpj;
    }
    strCnpj = strCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  return strCnpj
})
