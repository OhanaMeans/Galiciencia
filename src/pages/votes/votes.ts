import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, AlertController, ToastController } from 'ionic-angular';

import { RestProvider } from '../../providers/rest/rest';

/**
 * Generated class for the VotesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-votes',
  templateUrl: 'votes.html',
})

export class VotesPage {

  MAX_GROUPS = 4
  group: number = undefined
  group_member: number = undefined

  custom_projects = []
  all_projects: any[] = undefined
  previous_votes: any[] = undefined

  current_dropdown: string = undefined
  dropdown_menu: Array<{ id: number, title: string }> = []

  aviso: string = ""
  puntuacion: any[] = [ 1, 1, 1, 1, 1 ]

  constructor(
    private rest: RestProvider,
    public navParams: NavParams,
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    this.group = this.navParams.get('group')
    this.group_member = this.navParams.get('group_member')
  }

  ionViewDidLoad() {
    this.getProyectos()
  }

  getProyectos() {
    this.rest.getProyectos().then(
      (res) => {
        this.all_projects = JSON.parse(JSON.stringify(res)).proyectos;
        this.splitProyectos()
        this.customDropdown()
        this.getPrevVotes()
      }
    ).catch(
      (err) => {
      }
    )
  }

  splitProyectos() {
    let index = 0;
    for (let i = 1 + this.group; i < this.all_projects.length; i += this.MAX_GROUPS) {
      if(i === 16) this.custom_projects[index] = this.all_projects[19]
      else if(i === 19) this.custom_projects[index] = this.all_projects[16]
      else this.custom_projects[index] = this.all_projects[i]
      index++;
    }
  }

  customDropdown() {
    for (let i = 0; i < this.custom_projects.length; i++) {
      this.dropdown_menu.push({ id: this.custom_projects[i].id, title: this.custom_projects[i].title })
    }
  }

  getPrevVotes() {
    let index = 0;
    for(let i = 1 + this.group; i < this.all_projects.length; i += this.MAX_GROUPS) {
      if(i === 16) this.previous_votes[index] = this.all_projects[19].votes
      else if(i === 19) this.previous_votes[index] = this.all_projects[16].votes
      else this.previous_votes[index] = this.all_projects[i].votes
      index++;
    }
  }

  changeVotes() {
    let sliders = document.getElementsByTagName('ion-range')
    let votes = this.all_projects[this.current_dropdown].votes[this.group_member];
      
    for(let i = 0; i < sliders.length; i++)
      this.puntuacion[i] = votes === undefined ? 1 : votes[1][i]

    if(votes !== undefined) {
      let toast = this.toastCtrl.create({
        message: 'Ya has puntuado este proyecto',
        duration: 2000,
        position: 'bottom'
      })
  
      toast.present()
    }
  }

  sendPuntuacion() {
    if(this.current_dropdown === undefined) {
      this.noProjectSelected()
    } else {
      this.confirmarVotacion(this.calcularMedia())
    }
  }

  noProjectSelected() {
    let alert = this.alertCtrl.create({
      title: 'Error',
      subTitle: 'Debe seleccionar un proyecto.',
      buttons: ['Aceptar']
    })
    alert.present()
  }

  noProjectsAvailable() {
    let toast = this.toastCtrl.create({
      message: 'Ha ocurrido un error. Comprueba tu conexión a Internet y reinicia la aplicación',
      duration: 2000,
      position: 'bottom'
    })

    toast.present()
  }

  calcularMedia() {
    let media = 0
    for (let i = 0; i < this.puntuacion.length; i++) {
      media += this.puntuacion[i]
    }
    return [ (media / this.puntuacion.length), this.puntuacion ]
  }

  confirmarVotacion(media: (number | any[])[]) {
    let alert = this.alertCtrl.create({
      title: 'Confirmar votación',
      message: this.all_projects[this.current_dropdown].votes[this.group_member] === undefined ?
        '¿Seguro que quieres puntuar al proyecto número ' + this.current_dropdown + ': ' + this.all_projects[this.current_dropdown].title + '?' :
        '¿Seguro que quieres modificar el voto del proyecto número ' + this.current_dropdown + ': ' + this.all_projects[this.current_dropdown].title + '?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Enviar',
          handler: () => {
            this.enviarInfo(media)
          }
        }
      ]
    });
    alert.present();
  }

  enviarInfo(media: (number | any[])[]) {
    this.rest.updateProyectos(this.current_dropdown, this.group_member, media).then(
      (res) => {
          this.navCtrl.setRoot(this.navCtrl.getActive().component, {
            group: this.group,
            group_member: this.group_member
          });

          let toast = this.toastCtrl.create({
            message: 'Votación enviada correctamente',
            duration: 2000,
            position: 'bottom'
          })

          toast.present()

      }
    )
  }
}
