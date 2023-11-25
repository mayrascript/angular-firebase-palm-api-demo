import {Component, inject} from '@angular/core';
import {CommonModule, NgClass, NgFor, NgIf} from '@angular/common';
import {addDoc, collection, Firestore, onSnapshot} from "@angular/fire/firestore";

interface DisplayMessage {
  text: string;
  type: 'PROMPT' | 'RESPONSE';
}
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgFor, NgClass, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class AppComponent {
  title = 'chatbot-palm-demo';

  private readonly firestore: Firestore = inject(Firestore);
  private readonly discussionCollection = collection(this.firestore, 'discussions');
  prompt = '';
  status = '';
  errorMsg = '';
  responses: DisplayMessage[] = [
    {
      text: "Hello Mayra, How can I help you today?",
      type: 'RESPONSE'
    }
  ];

  async submitPrompt(event: Event, promptText: HTMLInputElement) {
    event.preventDefault();

    if (!promptText.value) return;
    this.prompt = promptText.value;
    promptText.value = '';
    this.responses.push({
      text: this.prompt,
      type: 'PROMPT',
    });

    this.status = 'Loading...';
    const discussionDoc = await addDoc(this.discussionCollection, { prompt: this.prompt });

    const destroyFn = onSnapshot(discussionDoc, {
      next: snap => {
        const conversation = snap.data();
        if (conversation && conversation['status']) {
          const state = conversation['status']['state'];

          switch (state) {
            case 'COMPLETED':
              this.status = '';
              this.responses.push({
                text: conversation['response'],
                type: 'RESPONSE',
              });
              destroyFn();
              break;
            case 'PROCESSING':
              this.status = 'preparing your answer...';
              break;
            case 'ERRORED':
              this.status = 'Oh no! Something went wrong. Please try again.';
              destroyFn();
              break;
          }
        }
      },
      error: err => {
        console.log(err);
        this.errorMsg = err.message;
        destroyFn();
      }
    })
  }
}
