/**
 * Re-exports core utilities from @var/shared.
 * The storefront imports cn/formatPrice through this file so that
 * if @var/shared adds additional utilities, they can be re-exported
 * from one place.
 */
export { cn, formatPrice } from "@var/shared";
