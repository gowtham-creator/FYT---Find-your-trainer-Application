/**
 * The one place Phosphor is imported (docs/MOBILE-DESIGN.md §5.1). Screens use
 * semantic names; weight "fill" marks active/selected states.
 */
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  BellIcon,
  BookmarkSimpleIcon,
  BuildingsIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChalkboardTeacherIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CompassIcon,
  CopyIcon,
  DeviceMobileIcon,
  GraduationCapIcon,
  GearSixIcon,
  HouseIcon,
  InfoIcon,
  LockIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ShareNetworkIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  StarIcon,
  TimerIcon,
  TranslateIcon,
  UsersThreeIcon,
  UserCircleIcon,
  VideoCameraIcon,
  XIcon,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "phosphor-react-native";
import type { ColorValue } from "react-native";
import { usePalette } from "../theme";

const MAP = {
  home: HouseIcon,
  explore: CompassIcon,
  bookings: CalendarCheckIcon,
  profile: UserCircleIcon,
  search: MagnifyingGlassIcon,
  filter: SlidersHorizontalIcon,
  bell: BellIcon,
  back: CaretLeftIcon,
  chevron: CaretRightIcon,
  "chevron-down": CaretDownIcon,
  close: XIcon,
  clock: ClockIcon,
  calendar: CalendarBlankIcon,
  video: VideoCameraIcon,
  pin: MapPinIcon,
  institute: BuildingsIcon,
  trainer: ChalkboardTeacherIcon,
  star: StarIcon,
  check: CheckIcon,
  "check-circle": CheckCircleIcon,
  info: InfoIcon,
  copy: CopyIcon,
  share: ShareNetworkIcon,
  bookmark: BookmarkSimpleIcon,
  settings: GearSixIcon,
  logout: SignOutIcon,
  lock: LockIcon,
  external: ArrowSquareOutIcon,
  arrow: ArrowRightIcon,
  phone: DeviceMobileIcon,
  education: GraduationCapIcon,
  timer: TimerIcon,
  language: TranslateIcon,
  people: UsersThreeIcon,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof MAP;

interface Props {
  name: IconName;
  size?: 16 | 20 | 24 | 28 | 40;
  /** regular at rest, fill for active/selected, bold only for small checks. */
  weight?: Extract<IconWeight, "regular" | "bold" | "fill" | "duotone">;
  color?: ColorValue;
}

export function Icon({ name, size = 20, weight = "regular", color }: Props) {
  const p = usePalette();
  const C = MAP[name];
  return <C size={size} weight={weight} color={(color ?? p.ink) as string} />;
}
