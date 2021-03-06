import {Component} from '@angular/core';
import {VideoSettingsService} from './video.settings.service';
import {SettingsComponent} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ClientConfig} from '../../../../../common/config/public/ConfigClass';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ScheduledJobsService} from '../scheduled-jobs.service';
import {DefaultsJobs, JobDTO} from '../../../../../common/entities/job/JobDTO';
import {ServerConfig} from '../../../../../common/config/private/IPrivateConfig';
import {JobProgressStates} from '../../../../../common/entities/job/JobProgressDTO';


@Component({
  selector: 'app-settings-video',
  templateUrl: './video.settings.component.html',
  styleUrls: ['./video.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [VideoSettingsService],
})
export class VideoSettingsComponent extends SettingsComponent<{ server: ServerConfig.VideoConfig, client: ClientConfig.VideoConfig }> {

  resolutions: ServerConfig.resolutionType[] = [360, 480, 720, 1080, 1440, 2160, 4320];
  codecs: { [key: string]: ServerConfig.codecType[] } = {webm: ['libvpx', 'libvpx-vp9'], mp4: ['libx264', 'libx265']};
  formats: ServerConfig.formatType[] = ['mp4', 'webm'];
  fps = [24, 25, 30, 48, 50, 60];

  JobProgressStates = JobProgressStates;
  readonly jobName = DefaultsJobs[DefaultsJobs['Video Converting']];

  constructor(_authService: AuthenticationService,
              _navigation: NavigationService,
              _settingsService: VideoSettingsService,
              public jobsService: ScheduledJobsService,
              notification: NotificationService,
              i18n: I18n) {
    super(i18n('Video'), _authService, _navigation, _settingsService, notification, i18n, s => ({
      client: s.Client.Media.Video,
      server: s.Server.Media.Video
    }));

    const currentRes = _settingsService.Settings.value.Server.Media.Video.transcoding.resolution;
    if (this.resolutions.indexOf(currentRes) === -1) {
      this.resolutions.push(currentRes);
    }
  }


  get Progress() {
    return this.jobsService.progress.value[JobDTO.getHashName(DefaultsJobs[DefaultsJobs['Video Converting']])];
  }

  get bitRate(): number {
    return this.settings.server.transcoding.bitRate / 1024 / 1024;
  }

  set bitRate(value: number) {
    this.settings.server.transcoding.bitRate = Math.round(value * 1024 * 1024);
  }

  getRecommendedBitRate(resolution: number, fps: number) {
    let bitRate = 1024 * 1024;
    if (resolution <= 360) {
      bitRate = 1024 * 1024;
    } else if (resolution <= 480) {
      bitRate = 2.5 * 1024 * 1024;
    } else if (resolution <= 720) {
      bitRate = 5 * 1024 * 1024;
    } else if (resolution <= 1080) {
      bitRate = 8 * 1024 * 1024;
    } else if (resolution <= 1440) {
      bitRate = 16 * 1024 * 1024;
    } else if (resolution <= 2016) {
      bitRate = 40 * 1024 * 1024;
    }

    if (fps > 30) {
      bitRate *= 1.5;
    }

    return bitRate;
  }

  updateBitRate() {
    this.settings.server.transcoding.bitRate = this.getRecommendedBitRate(this.settings.server.transcoding.resolution,
      this.settings.server.transcoding.fps);
  }

  formatChanged(format: ServerConfig.formatType) {
    this.settings.server.transcoding.codec = this.codecs[format][0];
  }


}



