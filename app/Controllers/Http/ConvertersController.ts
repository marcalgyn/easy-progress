import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Empresa from 'App/Models/Empresa'

export default class ConvertersController {
  public async index({ view }: HttpContextContract) {
    const empresas = await Empresa.all()

    return view.render('converter/index', { empresas })
  }
}
