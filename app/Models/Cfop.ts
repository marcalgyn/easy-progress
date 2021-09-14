import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Cfop extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public codigo: number

  @column.dateTime({ autoCreate: true })
  public createdAt?: DateTime

}
