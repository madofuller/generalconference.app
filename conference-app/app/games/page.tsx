import { redirect } from 'next/navigation';

export default function GamesRedirect() {
  redirect('/games/wordle');
}
